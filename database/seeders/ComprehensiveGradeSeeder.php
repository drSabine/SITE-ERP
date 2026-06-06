<?php

namespace Database\Seeders;

use App\Models\AcademicTerm;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\EnrollmentCourse;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use App\Models\TeacherAssignment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ComprehensiveGradeSeeder extends Seeder
{
    private const PAST_SCHOOL_YEARS = [
        '2022-2023' => ['start_date' => '2022-08-01', 'end_date' => '2023-05-31'],
        '2023-2024' => ['start_date' => '2023-08-01', 'end_date' => '2024-05-31'],
        '2024-2025' => ['start_date' => '2024-08-01', 'end_date' => '2025-05-31'],
    ];

    private const SCHOOL_YEAR_PROFILES = [
        '2022-2023' => [
            'cohorts' => [
                'BSIT' => [1 => 18, 2 => 15, 3 => 12, 4 => 9],
                'BSCE' => [1 => 15, 2 => 12, 3 => 9, 4 => 6],
            ],
            'drop_rate' => 9,
            'inc_rate' => 8,
            'fail_rate' => 13,
            'grade_shift' => 3,
        ],
        '2023-2024' => [
            'cohorts' => [
                'BSIT' => [1 => 22, 2 => 18, 3 => 15, 4 => 11],
                'BSCE' => [1 => 18, 2 => 15, 3 => 12, 4 => 8],
            ],
            'drop_rate' => 7,
            'inc_rate' => 7,
            'fail_rate' => 11,
            'grade_shift' => 2,
        ],
        '2024-2025' => [
            'cohorts' => [
                'BSIT' => [1 => 25, 2 => 21, 3 => 18, 4 => 14],
                'BSCE' => [1 => 21, 2 => 18, 3 => 14, 4 => 10],
            ],
            'drop_rate' => 6,
            'inc_rate' => 6,
            'fail_rate' => 9,
            'grade_shift' => 1,
        ],
        '2025-2026' => [
            'drop_rate' => 5,
            'inc_rate' => 7,
            'fail_rate' => 8,
            'grade_shift' => 0,
            'submitted_rate' => 58,
        ],
    ];

    private const PASSING_GRADES = ['1.25', '1.50', '1.50', '1.75', '1.75', '2.00', '2.00', '2.00',
                                    '2.25', '2.25', '2.50', '2.50', '2.75', '2.75', '3.00', '3.00'];

    private array $teachers = [];
    private int $teacherIndex = 0;
    private array $sectionMap = [];
    private array $courseMap = [];

    public function run(): void
    {
        $this->teachers = User::teachers()->active()->orderBy('id')->get()->all();

        if (empty($this->teachers)) {
            $this->command->warn('No teachers found. Skipping ComprehensiveGradeSeeder.');
            return;
        }

        // Pre-build section map: "program_id_year_level" => [Section, ...]
        foreach (Section::active()->orderBy('name')->get() as $section) {
            $key = "{$section->program_id}_{$section->year_level}";
            $this->sectionMap[$key][] = $section;
        }

        foreach (Course::active()->get(['id', 'program_id', 'year_level', 'semester_type', 'units']) as $course) {
            $key = $this->courseKey($course->program_id, $course->year_level, $course->semester_type);
            $this->courseMap[$key][] = $course;
        }

        // 1. Seed fully-finalized past school years
        foreach (self::PAST_SCHOOL_YEARS as $name => $data) {
            $this->command->info("Seeding past school year: {$name}");
            $schoolYear = $this->seedPastSchoolYear($name, $data);
            $this->seedTermsForSchoolYear($schoolYear, isCurrentYear: false);
        }

        // 2. Seed 2025-2026 1st semester (exists in DB but has no enrollments yet)
        $currentSchoolYear = SchoolYear::where('name', '2025-2026')->first();
        if ($currentSchoolYear) {
            $this->command->info("Seeding 2025-2026 1st semester (completed)");
            $firstTerm = $currentSchoolYear->academicTerms()->where('semester', 'first')->first();
            if ($firstTerm) {
                $this->seedTermEnrollments($firstTerm, isCurrentYear: false);
                $this->createTeacherAssignmentsForTerm($firstTerm);
                $this->seedFinalizedGrades($firstTerm);
            }
        }

        // 3. Seed active 2nd semester (enrollments already exist from EnrollmentSeeder)
        $activeTerm = AcademicTerm::active()->first();
        if ($activeTerm) {
            $this->command->info("Seeding 2025-2026 2nd semester (active — partial grades)");
            $this->createTeacherAssignmentsForTerm($activeTerm);
            $this->seedActiveTermGrades($activeTerm);
        }

        $this->command->info('ComprehensiveGradeSeeder complete.');
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function seedPastSchoolYear(string $name, array $data): SchoolYear
    {
        $startYear = (int) substr($data['start_date'], 0, 4);
        $endYear   = (int) substr($data['end_date'], 0, 4);

        $schoolYear = SchoolYear::updateOrCreate(
            ['name' => $name],
            [
                'start_date' => $data['start_date'],
                'end_date'   => $data['end_date'],
                'is_active'  => false,
                'status'     => 'finalized',
            ]
        );

        $terms = [
            ['semester' => 'first',  'start_date' => "{$startYear}-08-01", 'end_date' => "{$startYear}-12-20"],
            ['semester' => 'second', 'start_date' => "{$endYear}-01-05",   'end_date' => "{$endYear}-05-31"],
            ['semester' => 'summer', 'start_date' => "{$endYear}-06-01",   'end_date' => "{$endYear}-07-31"],
        ];

        foreach ($terms as $termData) {
            $schoolYear->academicTerms()->updateOrCreate(
                ['semester' => $termData['semester']],
                [...$termData, 'is_active' => false]
            );
        }

        return $schoolYear->load('academicTerms');
    }

    private function seedTermsForSchoolYear(SchoolYear $schoolYear, bool $isCurrentYear): void
    {
        foreach ($schoolYear->academicTerms as $term) {
            $this->seedTermEnrollments($term, isCurrentYear: $isCurrentYear);
            $this->createTeacherAssignmentsForTerm($term);
            $this->seedFinalizedGrades($term);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function seedTermEnrollments(AcademicTerm $term, bool $isCurrentYear): void
    {
        $term->loadMissing('schoolYear');

        $students = $isCurrentYear
            ? Student::active()->orderBy('program_id')->orderBy('year_level')->orderBy('id')->get()
            : $this->studentsForHistoricalTerm($term);

        $sectionCounters = [];

        foreach ($students as $student) {
            $courses = $this->coursesFor($student->program_id, $student->year_level, $term->semester);

            if (empty($courses)) {
                continue;
            }

            $key = "{$student->program_id}_{$student->year_level}";

            if (! isset($sectionCounters[$key])) {
                $sectionCounters[$key] = 0;
            }

            $sectionList = $this->sectionMap[$key] ?? [];
            $section = empty($sectionList)
                ? null
                : $sectionList[$sectionCounters[$key] % count($sectionList)];

            $sectionCounters[$key]++;

            $enrollment = Enrollment::updateOrCreate(
                [
                    'student_id'       => $student->id,
                    'academic_term_id' => $term->id,
                ],
                [
                    'program_id'  => $student->program_id,
                    'section_id'  => $section?->id,
                    'year_level'  => $student->year_level,
                    'status'      => 'enrolled',
                    'enrolled_at' => $term->start_date ?? now(),
                ]
            );

            $this->seedEnrollmentCourses($enrollment, $courses);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function createTeacherAssignmentsForTerm(AcademicTerm $term): void
    {
        $now = now();
        $rows = [];

        foreach (Section::active()->get() as $section) {
            $courses = $this->coursesFor($section->program_id, $section->year_level, $term->semester);

            foreach ($courses as $course) {
                $teacher = $this->nextTeacher();

                $rows[] = [
                    'academic_term_id' => $term->id,
                    'section_id'       => $section->id,
                    'course_id'        => $course->id,
                    'teacher_id'       => $teacher->id,
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ];
            }
        }

        collect($rows)->chunk(500)->each(function (Collection $chunk) {
            TeacherAssignment::upsert(
                $chunk->all(),
                ['academic_term_id', 'section_id', 'course_id'],
                ['teacher_id', 'updated_at']
            );
        });
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Seed finalized grade outcomes for all enrollment_courses in a term.
     * Distribution: ~75% passed, ~10% failed, ~8% inc, ~7% dropped.
     */
    private function seedFinalizedGrades(AcademicTerm $term): void
    {
        $term->loadMissing('schoolYear');
        $profile = $this->profileForTerm($term);

        $enrollments = Enrollment::where('academic_term_id', $term->id)
            ->with(['enrollmentCourses.course:id,units,year_level'])
            ->get();

        $courseUpdates = [];
        $enrollmentUpdates = [];
        $now = now();

        foreach ($enrollments as $enrollment) {
            $enrollmentCourses = $enrollment->enrollmentCourses->sortBy('id')->values();
            $droppedCount = 0;

            foreach ($enrollmentCourses as $courseOffset => $ec) {
                $outcomeScore = $this->outcomeScore($enrollment, $ec, $term, $courseOffset);
                $courseRisk = $this->courseRisk($ec);
                $dropThreshold = $profile['drop_rate'] + intdiv($courseRisk, 3);
                $incThreshold = $dropThreshold + $profile['inc_rate'] + ($term->semester === 'summer' ? 2 : 0);
                $failThreshold = $incThreshold + $profile['fail_rate'] + intdiv($courseRisk, 2);

                if ($outcomeScore < $dropThreshold) {
                    $status = 'dropped';
                    $finalGrade = null;
                    $droppedCount++;
                } elseif ($outcomeScore < $incThreshold) {
                    $status = 'inc';
                    $finalGrade = null;
                } elseif ($outcomeScore < $failThreshold) {
                    $status = 'failed';
                    $finalGrade = 5.00;
                } else {
                    $gradeIndex = ($outcomeScore + $profile['grade_shift'] + $courseRisk) % count(self::PASSING_GRADES);
                    $status = 'passed';
                    $finalGrade = self::PASSING_GRADES[$gradeIndex];
                }

                $courseUpdates[] = [
                    'id'            => $ec->id,
                    'enrollment_id' => $ec->enrollment_id,
                    'course_id'     => $ec->course_id,
                    'final_grade'   => $finalGrade,
                    'status'        => $status,
                    'created_at'    => $ec->created_at,
                    'updated_at'    => $now,
                ];
            }

            $totalCourses = $enrollmentCourses->count();
            $isWithdrawn  = $totalCourses > 0 && $droppedCount > ($totalCourses * 0.5);

            $enrollmentUpdates[] = [
                'id'               => $enrollment->id,
                'student_id'       => $enrollment->student_id,
                'academic_term_id' => $enrollment->academic_term_id,
                'program_id'       => $enrollment->program_id,
                'section_id'       => $enrollment->section_id,
                'year_level'       => $enrollment->year_level,
                'status'           => $isWithdrawn ? 'dropped' : 'completed',
                'enrolled_at'      => $enrollment->enrolled_at,
                'completed_at'     => $isWithdrawn ? null : $term->end_date,
                'dropped_at'       => $isWithdrawn ? $term->end_date : null,
                'created_at'       => $enrollment->created_at,
                'updated_at'       => $now,
            ];
        }

        $this->upsertEnrollmentCourseRows($courseUpdates);
        $this->upsertEnrollmentRows($enrollmentUpdates);
    }

    /**
     * Seed partial grades for the active term.
     * Distribution: 50% not graded, 30% grade submitted, 10% inc, 10% dropped.
     */
    private function seedActiveTermGrades(AcademicTerm $term): void
    {
        $term->loadMissing('schoolYear');
        $profile = $this->profileForTerm($term);

        $enrollments = Enrollment::where('academic_term_id', $term->id)
            ->with(['enrollmentCourses.course:id,units,year_level'])
            ->get();

        $courseUpdates = [];
        $now = now();

        foreach ($enrollments as $enrollment) {
            $enrollmentCourses = $enrollment->enrollmentCourses->sortBy('id')->values();

            foreach ($enrollmentCourses as $courseOffset => $ec) {
                $outcomeScore = $this->outcomeScore($enrollment, $ec, $term, $courseOffset);
                $courseRisk = $this->courseRisk($ec);
                $dropThreshold = $profile['drop_rate'] + intdiv($courseRisk, 3);
                $incThreshold = $dropThreshold + $profile['inc_rate'] + ($term->semester === 'summer' ? 2 : 0);
                $submittedThreshold = $incThreshold + $profile['submitted_rate'] - intdiv($courseRisk, 2);

                if ($outcomeScore < $dropThreshold) {
                    $status = 'dropped';
                    $finalGrade = null;
                } elseif ($outcomeScore < $incThreshold) {
                    $status = 'inc';
                    $finalGrade = null;
                } elseif ($outcomeScore < $submittedThreshold) {
                    $gradeIndex = ($outcomeScore + $profile['grade_shift'] + $courseRisk) % count(self::PASSING_GRADES);
                    $status = 'active';
                    $finalGrade = self::PASSING_GRADES[$gradeIndex];
                } else {
                    $status = 'active';
                    $finalGrade = null;
                }

                $courseUpdates[] = [
                    'id'            => $ec->id,
                    'enrollment_id' => $ec->enrollment_id,
                    'course_id'     => $ec->course_id,
                    'final_grade'   => $finalGrade,
                    'status'        => $status,
                    'created_at'    => $ec->created_at,
                    'updated_at'    => $now,
                ];
            }
        }

        $this->upsertEnrollmentCourseRows($courseUpdates);
    }

    private function studentsForHistoricalTerm(AcademicTerm $term): Collection
    {
        $profile = $this->profileForTerm($term);
        $cohorts = $profile['cohorts'] ?? [];

        return Student::active()
            ->with(['program:id,code'])
            ->orderBy('program_id')
            ->orderBy('year_level')
            ->orderBy('id')
            ->get()
            ->groupBy(fn (Student $student) => "{$student->program?->code}_{$student->year_level}")
            ->flatMap(function (Collection $students, string $key) use ($cohorts) {
                [$programCode, $yearLevel] = explode('_', $key);
                $limit = $cohorts[$programCode][(int) $yearLevel] ?? $students->count();

                return $students->take($limit);
            })
            ->values();
    }

    private function profileForTerm(AcademicTerm $term): array
    {
        $schoolYearName = $term->schoolYear?->name ?? '2025-2026';

        return self::SCHOOL_YEAR_PROFILES[$schoolYearName] ?? self::SCHOOL_YEAR_PROFILES['2025-2026'];
    }

    private function outcomeScore(Enrollment $enrollment, EnrollmentCourse $enrollmentCourse, AcademicTerm $term, int $courseOffset): int
    {
        $semesterWeight = match ($term->semester) {
            'first' => 11,
            'second' => 23,
            'summer' => 37,
            default => 17,
        };

        return (
            ($enrollment->student_id * 13) +
            ($enrollmentCourse->course_id * 7) +
            ($enrollment->year_level * 5) +
            ($courseOffset * 19) +
            $semesterWeight
        ) % 100;
    }

    private function courseRisk(EnrollmentCourse $enrollmentCourse): int
    {
        $course = $enrollmentCourse->course;

        if (! $course) {
            return 0;
        }

        return ((int) $course->units * 2) + max(0, ((int) $course->year_level - 1));
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function seedEnrollmentCourses(Enrollment $enrollment, array $courses): void
    {
        $now = now();
        $rows = collect($courses)->map(fn ($course) => [
            'enrollment_id' => $enrollment->id,
            'course_id'     => $course->id,
            'status'        => 'active',
            'created_at'    => $now,
            'updated_at'    => $now,
        ])->all();

        if (! empty($rows)) {
            DB::table('enrollment_courses')->insertOrIgnore($rows);
        }
    }

    private function coursesFor(int $programId, int $yearLevel, string $semester): array
    {
        return $this->courseMap[$this->courseKey($programId, $yearLevel, $semester)] ?? [];
    }

    private function courseKey(int $programId, int $yearLevel, string $semester): string
    {
        return "{$programId}_{$yearLevel}_{$semester}";
    }

    private function upsertEnrollmentCourseRows(array $rows): void
    {
        collect($rows)->chunk(1000)->each(function (Collection $chunk) {
            DB::table('enrollment_courses')->upsert(
                $chunk->all(),
                ['id'],
                ['final_grade', 'status', 'updated_at']
            );
        });
    }

    private function upsertEnrollmentRows(array $rows): void
    {
        collect($rows)->chunk(1000)->each(function (Collection $chunk) {
            DB::table('enrollments')->upsert(
                $chunk->all(),
                ['id'],
                ['status', 'completed_at', 'dropped_at', 'updated_at']
            );
        });
    }

    private function nextTeacher(): object
    {
        $teacher = $this->teachers[$this->teacherIndex % count($this->teachers)];
        $this->teacherIndex++;
        return $teacher;
    }
}
