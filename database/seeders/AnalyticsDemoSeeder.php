<?php

namespace Database\Seeders;

use App\Models\AcademicTerm;
use App\Models\Enrollment;
use App\Models\EnrollmentCourse;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use App\Services\EnrollmentService;
use Illuminate\Database\Seeder;

class AnalyticsDemoSeeder extends Seeder
{
    private const SCHOOL_YEARS = [
        '2022-2023' => ['start_date' => '2022-08-01', 'end_date' => '2023-05-31', 'student_limit' => 18],
        '2023-2024' => ['start_date' => '2023-08-01', 'end_date' => '2024-05-31', 'student_limit' => 24],
        '2024-2025' => ['start_date' => '2024-08-01', 'end_date' => '2025-05-31', 'student_limit' => 30],
    ];

    public function __construct(private EnrollmentService $enrollmentService) {}

    public function run(): void
    {
        $students = Student::active()
            ->orderBy('program_id')
            ->orderBy('year_level')
            ->orderBy('last_name')
            ->get();

        if ($students->isEmpty()) {
            $this->command->warn('No students found. Skipping analytics demo seeding.');
            return;
        }

        foreach (self::SCHOOL_YEARS as $name => $schoolYearData) {
            $schoolYear = $this->seedSchoolYear($name, $schoolYearData);
            $selectedStudents = $students->take($schoolYearData['student_limit'])->values();

            foreach ($schoolYear->academicTerms as $academicTerm) {
                foreach ($selectedStudents as $studentIndex => $student) {
                    $this->seedEnrollment($academicTerm, $student, $studentIndex);
                }
            }
        }
    }

    private function seedSchoolYear(string $name, array $schoolYearData): SchoolYear
    {
        $schoolYear = SchoolYear::updateOrCreate(
            ['name' => $name],
            [
                'start_date' => $schoolYearData['start_date'],
                'end_date'   => $schoolYearData['end_date'],
                'is_active'  => false,
                'status'     => 'finalized',
            ]
        );

        foreach ($this->termsFor($schoolYearData) as $termData) {
            $schoolYear->academicTerms()->updateOrCreate(
                ['semester' => $termData['semester']],
                $termData
            );
        }

        return $schoolYear->load('academicTerms');
    }

    private function termsFor(array $schoolYearData): array
    {
        $startYear = (int) substr($schoolYearData['start_date'], 0, 4);
        $endYear = (int) substr($schoolYearData['end_date'], 0, 4);

        return [
            [
                'semester'   => 'first',
                'start_date' => "{$startYear}-08-01",
                'end_date'   => "{$startYear}-12-20",
                'is_active'  => false,
            ],
            [
                'semester'   => 'second',
                'start_date' => "{$endYear}-01-05",
                'end_date'   => "{$endYear}-05-31",
                'is_active'  => false,
            ],
        ];
    }

    private function seedEnrollment(AcademicTerm $academicTerm, Student $student, int $studentIndex): void
    {
        $section = Section::active()
            ->where('program_id', $student->program_id)
            ->where('year_level', $student->year_level)
            ->orderBy('name')
            ->first();

        $isDropped = $studentIndex % 17 === 0 && $academicTerm->semester === 'second';

        $enrollment = Enrollment::updateOrCreate(
            [
                'student_id' => $student->id,
                'academic_term_id' => $academicTerm->id,
            ],
            [
                'program_id' => $student->program_id,
                'section_id' => $section?->id,
                'year_level' => $student->year_level,
                'status' => $isDropped ? 'dropped' : 'completed',
                'enrolled_at' => $academicTerm->start_date,
                'completed_at' => $isDropped ? null : $academicTerm->end_date,
                'dropped_at' => $isDropped ? $academicTerm->end_date : null,
            ]
        );

        $this->enrollmentService->loadStandardCurriculum($enrollment);
        $this->seedCourseOutcomes($enrollment, $studentIndex, $isDropped);
    }

    private function seedCourseOutcomes(Enrollment $enrollment, int $studentIndex, bool $isDropped): void
    {
        $enrollmentCourses = $enrollment->enrollmentCourses()->orderBy('id')->get();

        foreach ($enrollmentCourses as $courseIndex => $enrollmentCourse) {
            if ($isDropped && $courseIndex >= 2) {
                $this->updateCourseOutcome($enrollmentCourse, null, 'dropped');
                continue;
            }

            $pattern = ($studentIndex + $courseIndex) % 12;

            if ($pattern === 0) {
                $this->updateCourseOutcome($enrollmentCourse, null, 'inc');
                continue;
            }

            if ($pattern === 1) {
                $this->updateCourseOutcome($enrollmentCourse, '5.00', 'failed');
                continue;
            }

            $grades = ['1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00'];
            $this->updateCourseOutcome($enrollmentCourse, $grades[$pattern % count($grades)], 'passed');
        }
    }

    private function updateCourseOutcome(EnrollmentCourse $enrollmentCourse, ?string $grade, string $status): void
    {
        $enrollmentCourse->update([
            'final_grade' => $grade,
            'status'      => $status,
        ]);
    }
}
