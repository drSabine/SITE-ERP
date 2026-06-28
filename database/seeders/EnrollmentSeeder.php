<?php

namespace Database\Seeders;

use App\Models\AcademicTerm;
use App\Models\Enrollment;
use App\Models\Section;
use App\Models\Student;
use App\Services\EnrollmentService;
use Illuminate\Database\Seeder;

class EnrollmentSeeder extends Seeder
{
    public function __construct(private EnrollmentService $service) {}

    public function run(): void
    {
        $activeTerm = AcademicTerm::with('schoolYear')->active()->first();

        if (! $activeTerm) {
            $this->command->warn('No active academic term found. Skipping enrollment seeding.');
            return;
        }

        $semesterLabel = match ($activeTerm->semester) {
            'first'  => '1st Semester',
            'second' => '2nd Semester',
            'summer' => 'Summer',
            default  => $activeTerm->semester,
        };

        $syName = $activeTerm->schoolYear?->name ?? 'N/A';
        $this->command->info("Enrolling all active students in: {$semesterLabel} (S.Y. {$syName})");

        // Build section map keyed by "program_id_year_level"
        $sectionMap = [];
        foreach (Section::active()->orderBy('name')->get() as $section) {
            $key = "{$section->program_id}_{$section->year_level}";
            $sectionMap[$key][] = $section;
        }

        // Group students by program+year_level to distribute evenly across sections
        $students = Student::active()
            ->orderBy('program_id')
            ->orderBy('year_level')
            ->orderBy('id')
            ->get();

        // Leave one student per program+year group unenrolled so coordinators have someone
        // to evaluate via "New Evaluation" out of the box.
        $leaveForEvaluation = $students
            ->groupBy(fn ($student) => "{$student->program_id}_{$student->year_level}")
            ->flatMap(fn ($group) => $group->sortByDesc('id')->take(1)->pluck('id'))
            ->flip();

        $sectionCounters = [];
        $enrolled = 0;
        $skipped  = 0;
        $reserved = 0;

        foreach ($students as $student) {
            if ($leaveForEvaluation->has($student->id)) {
                $reserved++;
                continue;
            }

            $key = "{$student->program_id}_{$student->year_level}";

            if (! isset($sectionCounters[$key])) {
                $sectionCounters[$key] = 0;
            }

            $sectionList = $sectionMap[$key] ?? [];
            $section = empty($sectionList)
                ? null
                : $sectionList[$sectionCounters[$key] % count($sectionList)];

            $sectionCounters[$key]++;

            $existingEnrollment = Enrollment::where('student_id', $student->id)
                ->where('academic_term_id', $activeTerm->id)
                ->first();

            if ($existingEnrollment) {
                if (! $existingEnrollment->section_id && $section) {
                    $existingEnrollment->update(['section_id' => $section->id]);
                }
                $skipped++;
                continue;
            }

            $enrollment = Enrollment::create([
                'student_id'       => $student->id,
                'academic_term_id' => $activeTerm->id,
                'program_id'       => $student->program_id,
                'section_id'       => $section?->id,
                'year_level'       => $student->year_level,
                'status'           => 'enrolled',
                'enrolled_at'      => now(),
            ]);

            try {
                $this->service->loadStandardCurriculum($enrollment);
            } catch (\Throwable $throwable) {
                // Non-fatal — enrollment row exists even if curriculum fails
            }

            $enrolled++;
        }

        $this->command->info("  → Enrolled: {$enrolled} | Skipped (already enrolled): {$skipped} | Reserved for evaluation: {$reserved}");
    }
}
