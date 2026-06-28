<?php

namespace Database\Seeders;

use App\Models\AcademicTerm;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\EnrollmentCourse;
use App\Models\Program;
use App\Models\SchoolYear;
use App\Models\Student;
use Illuminate\Database\Seeder;

/**
 * Creates students who are READY to graduate so the Graduation page has visible candidates:
 * every program course is passed (or credited, for transferees), with no INC and no pending
 * subjects, and they are not enrolled in the active term.
 */
class GraduationCandidateSeeder extends Seeder
{
    private const PASS_GRADES = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0];

    public function run(): void
    {
        $pastSchoolYears = SchoolYear::where('is_active', false)->orderBy('name')->get();
        if ($pastSchoolYears->isEmpty()) {
            $this->command->warn('GraduationCandidateSeeder: no past school years. Skipping.');
            return;
        }

        // term lookup: [school_year_id][semester] => AcademicTerm
        $termLookup = [];
        foreach (AcademicTerm::whereIn('school_year_id', $pastSchoolYears->pluck('id'))->get() as $term) {
            $termLookup[$term->school_year_id][$term->semester] = $term;
        }

        $plans = [
            ['code' => 'BSIT', 'finalYear' => 4, 'regular' => 5, 'transferee' => 2, 'last' => ['Almonte', 'Buenaventura', 'Concepcion', 'Delos Santos', 'Evangelista', 'Fortaleza', 'Gallardo']],
            ['code' => 'BSCE', 'finalYear' => 5, 'regular' => 4, 'transferee' => 2, 'last' => ['Habagat', 'Idanan', 'Jubilado', 'Katigbak', 'Lamboloto', 'Maranan']],
        ];

        $firstNames = ['Adrian Cole', 'Beatriz Anne', 'Cedric Jon', 'Danica Mae', 'Emilio Jose', 'Frances Kate', 'Gerald Pio'];
        $middleNames = ['Bautista', 'Reyes', 'Santos', 'Mercado', 'Aquino', 'Rivera', 'Velasco'];

        $created = 0;

        foreach ($plans as $plan) {
            $program = Program::where('code', $plan['code'])->first();
            if (! $program) {
                continue;
            }

            $courses = Course::active()->where('program_id', $program->id)
                ->get(['id', 'year_level', 'semester_type']);
            if ($courses->isEmpty()) {
                continue;
            }

            $total = $plan['regular'] + $plan['transferee'];
            for ($i = 0; $i < $total; $i++) {
                $isTransferee = $i >= $plan['regular'];

                $student = Student::create([
                    'first_name' => $firstNames[$i % count($firstNames)],
                    'middle_name' => $middleNames[$i % count($middleNames)],
                    'last_name'  => $plan['last'][$i % count($plan['last'])],
                    'sex'        => $i % 2 === 0 ? 'Male' : 'Female',
                    'program_id' => $program->id,
                    'year_level' => $plan['finalYear'],
                    'status'     => 'active',
                    'remarks'    => $isTransferee ? 'Transferee — credited first-year units.' : null,
                ]);

                $enrollmentByTerm = [];

                foreach ($courses as $course) {
                    $syIndex = min((int) $course->year_level - 1, $pastSchoolYears->count() - 1);
                    $schoolYear = $pastSchoolYears[$syIndex];
                    $term = $termLookup[$schoolYear->id][$course->semester_type]
                        ?? $termLookup[$schoolYear->id]['second']
                        ?? $termLookup[$schoolYear->id]['first']
                        ?? null;
                    if (! $term) {
                        continue;
                    }

                    if (! isset($enrollmentByTerm[$term->id])) {
                        $enrollmentByTerm[$term->id] = Enrollment::create([
                            'student_id'       => $student->id,
                            'academic_term_id' => $term->id,
                            'program_id'       => $program->id,
                            'section_id'       => null,
                            'year_level'       => $course->year_level,
                            'status'           => 'completed',
                            'enrolled_at'      => $term->start_date ?? now(),
                            'completed_at'     => $term->end_date ?? now(),
                        ]);
                    }

                    $credited = $isTransferee && (int) $course->year_level === 1;

                    EnrollmentCourse::create([
                        'enrollment_id' => $enrollmentByTerm[$term->id]->id,
                        'course_id'     => $course->id,
                        'final_grade'   => $credited ? null : self::PASS_GRADES[array_rand(self::PASS_GRADES)],
                        'status'        => $credited ? 'credited' : 'passed',
                    ]);
                }

                $created++;
            }
        }

        $this->command->info("GraduationCandidateSeeder: seeded {$created} ready-to-graduate candidates.");
    }
}
