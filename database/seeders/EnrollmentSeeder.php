<?php

namespace Database\Seeders;

use App\Models\AcademicTerm;
use App\Models\Enrollment;
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

        $students = Student::active()->get();
        $enrolled = 0;
        $skipped  = 0;

        foreach ($students as $student) {
            if (Enrollment::where('student_id', $student->id)
                ->where('academic_term_id', $activeTerm->id)
                ->exists()
            ) {
                $skipped++;
                continue;
            }

            $enrollment = Enrollment::create([
                'student_id'       => $student->id,
                'academic_term_id' => $activeTerm->id,
                'program_id'       => $student->program_id,
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

        $this->command->info("  → Enrolled: {$enrolled} | Skipped (already enrolled): {$skipped}");
    }
}
