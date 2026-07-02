<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Section;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\TeacherAssignment;
use App\Models\User;
use Database\Seeders\Support\StudentArchetype;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Builds each active student's FULL academic transcript with true year-by-year
 * progression, driven by the student's archetype (see {@see StudentArchetype}).
 *
 * A student currently in year Y attends year level L in the school year that is
 * (Y - L) years before the active one. Prior years are finalized; the active year's
 * 1st semester is completed and its 2nd semester is in progress.
 *
 * There are five school years — one per level of the deepest program (BSCE, 5 years) —
 * so every student, up to a 5th-year, gets a complete year-1-to-current transcript.
 *
 * Accuracy guarantees:
 *  - Regular students pass every curriculum subject for every completed year.
 *  - INC / failed / dropped are only ever placed on LEAF general-education subjects
 *    (not a prerequisite for anything, and a GE/minor by course code), so no
 *    upper-year student ever carries a bad mark on a major.
 *  - Transferees carry first-year work as `credited` (no grade, no duplicates).
 *  - Irregulars are left genuinely behind on a couple of lower-year minor subjects.
 *
 * Performance: per term we do one bulk insert of enrollments, one id refetch, and one
 * bulk insert of enrollment_courses — no per-row writes. MySQL / Laravel Cloud safe.
 */
class AcademicHistorySeeder extends Seeder
{
    private const PASSING_GRADES = ['1.25', '1.50', '1.50', '1.75', '1.75', '2.00', '2.00', '2.00',
                                    '2.25', '2.25', '2.50', '2.50', '2.75', '2.75', '3.00', '3.00'];

    private array $teachers = [];
    private int $teacherCursor = 0;

    /** [program_id][year_level][semester] => list of ['id','ge','leaf'] */
    private array $courseMap = [];
    /** [program_id][year_level] => [Section, ...] */
    private array $sectionMap = [];
    /** memo: "programId_year_sem" => array of leaf, non-major course ids (sorted) */
    private array $leafPickCache = [];

    public function run(): void
    {
        $this->teachers = User::teachers()->active()->orderBy('id')->get(['id'])->all();
        if (empty($this->teachers)) {
            $this->command->warn('AcademicHistorySeeder: no teachers found. Skipping.');
            return;
        }

        $this->buildCourseMap();
        $this->buildSectionMap();

        $schoolYears = SchoolYear::orderBy('start_date')->get();
        $currentIndex = $schoolYears->search(fn (SchoolYear $sy) => $sy->is_active);
        if ($currentIndex === false) {
            $this->command->warn('AcademicHistorySeeder: no active school year. Skipping.');
            return;
        }

        $students = Student::active()
            ->with('program:id,code')
            ->orderBy('program_id')->orderBy('year_level')->orderBy('id')
            ->get(['id', 'program_id', 'year_level', 'remarks']);

        // Reserve one student per program+year (highest id) out of the active term so
        // coordinators have someone to evaluate via "New Evaluation".
        $reserved = $students
            ->groupBy(fn (Student $s) => "{$s->program_id}_{$s->year_level}")
            ->flatMap(fn (Collection $group) => $group->sortByDesc('id')->take(1)->pluck('id'))
            ->flip();

        foreach ($schoolYears as $sIndex => $schoolYear) {
            foreach (['first', 'second', 'summer'] as $semester) {
                // The active year only runs 1st (completed) + 2nd (in progress); skip its summer.
                if ($sIndex === $currentIndex && $semester === 'summer') {
                    continue;
                }

                $term = $schoolYear->academicTerms->firstWhere('semester', $semester)
                    ?? $schoolYear->academicTerms()->where('semester', $semester)->first();
                if (! $term) {
                    continue;
                }

                $this->seedTerm($term, $semester, $sIndex, $currentIndex, $students, $reserved);
                $this->createTeacherAssignments($term, $semester);
            }
        }

        $this->command->info('AcademicHistorySeeder: transcripts + teaching loads seeded.');
    }

    private function seedTerm($term, string $semester, int $sIndex, int $currentIndex, Collection $students, Collection $reserved): void
    {
        $isActiveTerm    = $sIndex === $currentIndex && $semester === 'second';
        $isCurrentFirst  = $sIndex === $currentIndex && $semester === 'first';
        $now = now();

        // Who attends this term, and at what year level.
        $attendees = [];
        $sectionCounters = [];
        $enrollmentRows = [];

        foreach ($students as $student) {
            $yearLevel = (int) $student->year_level;
            $level = $yearLevel - ($currentIndex - $sIndex);

            if ($level < 1 || $level > $yearLevel) {
                continue;
            }
            $courses = $this->courseMap[$student->program_id][$level][$semester] ?? [];
            if (empty($courses)) {
                continue;
            }
            if ($isActiveTerm && $reserved->has($student->id)) {
                continue;
            }

            $section = $this->sectionFor($student->program_id, $level, $sectionCounters);

            $attendees[] = ['student' => $student, 'level' => $level, 'courses' => $courses];
            $enrollmentRows[] = [
                'student_id'       => $student->id,
                'academic_term_id' => $term->id,
                'program_id'       => $student->program_id,
                'section_id'       => $section?->id,
                'year_level'       => $level,
                'status'           => $isActiveTerm ? 'enrolled' : 'completed',
                'enrolled_at'      => $term->start_date ?? $now,
                'completed_at'     => $isActiveTerm ? null : $term->end_date,
                'created_at'       => $now,
                'updated_at'       => $now,
            ];
        }

        if (empty($enrollmentRows)) {
            return;
        }

        collect($enrollmentRows)->chunk(500)->each(fn (Collection $chunk) => DB::table('enrollments')->insert($chunk->all()));

        $enrollmentIdByStudent = DB::table('enrollments')
            ->where('academic_term_id', $term->id)
            ->pluck('id', 'student_id');

        $courseRows = [];
        foreach ($attendees as $attendee) {
            $student = $attendee['student'];
            $enrollmentId = $enrollmentIdByStudent[$student->id] ?? null;
            if (! $enrollmentId) {
                continue;
            }

            $archetype = StudentArchetype::fromRemarks($student->remarks);

            foreach ($attendee['courses'] as $course) {
                [$status, $grade] = $this->decideOutcome($student, $archetype, $course, $attendee['level'], $semester, $isActiveTerm, $isCurrentFirst);
                $courseRows[] = [
                    'enrollment_id' => $enrollmentId,
                    'course_id'     => $course['id'],
                    'final_grade'   => $grade,
                    'status'        => $status,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ];
            }

            // Recovered students retake (and pass) the minor subject they failed in 1st-year
            // 1st semester — the retake lives in 1st-year 2nd semester (a different term).
            if ($archetype === StudentArchetype::RECOVERED && $attendee['level'] === 1 && $semester === 'second') {
                $retakeId = $this->recoveredPick($student->program_id);
                $alreadyPresent = collect($attendee['courses'])->contains('id', $retakeId);
                if ($retakeId && ! $alreadyPresent) {
                    $courseRows[] = [
                        'enrollment_id' => $enrollmentId,
                        'course_id'     => $retakeId,
                        'final_grade'   => $this->gradeFor($student->id, $retakeId),
                        'status'        => 'passed',
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ];
                }
            }
        }

        collect($courseRows)->chunk(1000)->each(fn (Collection $chunk) => DB::table('enrollment_courses')->insert($chunk->all()));
    }

    /**
     * @return array{0:string,1:?string} [status, final_grade]
     */
    private function decideOutcome(Student $student, string $archetype, array $course, int $level, string $semester, bool $isActiveTerm, bool $isCurrentFirst): array
    {
        $isLeafMinor = $course['leaf'] && $course['ge'];

        // Active term (current 2nd sem). Every course is graded — the only non-numeric
        // outcomes are a few INC and Dropped marks, and only on general-education (minor)
        // leaf subjects. No blank/ungraded rows are produced.
        if ($isActiveTerm) {
            if ($isLeafMinor && $this->pseudo($student->id, $course['id'], 5) % 22 === 0) {
                return ['inc', null];
            }
            if ($isLeafMinor && $this->pseudo($student->id, $course['id'], 7) % 27 === 0) {
                return ['dropped', null];
            }
            return ['active', $this->gradeFor($student->id, $course['id'])];
        }

        // Finalized terms.
        if ($archetype === StudentArchetype::TRANSFEREE && $level === 1) {
            return ['credited', null];
        }
        if ($archetype === StudentArchetype::IRREGULAR && $level === 1 && $semester === 'first'
            && in_array($course['id'], $this->irregularPicks($student->program_id), true)) {
            return ['dropped', null];
        }
        if ($archetype === StudentArchetype::RECOVERED && $level === 1 && $semester === 'first'
            && $course['id'] === $this->recoveredPick($student->program_id)) {
            return ['failed', '5.00'];
        }
        if ($archetype === StudentArchetype::INC_CARRIER && $isCurrentFirst
            && $course['id'] === $this->incPick($student->program_id, $level)) {
            return ['inc', null];
        }

        return ['passed', $this->gradeFor($student->id, $course['id'])];
    }

    // ── picks (deterministic, leaf + non-major only) ──────────────────────────

    private function leafMinorIds(int $programId, int $year, string $semester): array
    {
        $key = "{$programId}_{$year}_{$semester}";
        if (! isset($this->leafPickCache[$key])) {
            $ids = collect($this->courseMap[$programId][$year][$semester] ?? [])
                ->filter(fn ($course) => $course['leaf'] && $course['ge'])
                ->sortBy('id')
                ->pluck('id')
                ->values()
                ->all();
            $this->leafPickCache[$key] = $ids;
        }

        return $this->leafPickCache[$key];
    }

    private function recoveredPick(int $programId): ?int
    {
        return $this->leafMinorIds($programId, 1, 'first')[0] ?? null;
    }

    private function irregularPicks(int $programId): array
    {
        return array_slice($this->leafMinorIds($programId, 1, 'first'), 0, 2);
    }

    private function incPick(int $programId, int $year): ?int
    {
        return $this->leafMinorIds($programId, $year, 'first')[0] ?? null;
    }

    // ── builders / helpers ────────────────────────────────────────────────────

    private function buildCourseMap(): void
    {
        $prereqTargets = DB::table('course_prerequisites')->distinct()->pluck('prerequisite_id')->flip();

        foreach (Course::active()->get(['id', 'program_id', 'course_code', 'year_level', 'semester_type']) as $course) {
            if ($course->year_level === null || $course->semester_type === null) {
                continue;
            }
            $this->courseMap[$course->program_id][$course->year_level][$course->semester_type][] = [
                'id'   => $course->id,
                'ge'   => $this->isGeneralEducation($course->course_code),
                'leaf' => ! $prereqTargets->has($course->id),
            ];
        }
    }

    private function buildSectionMap(): void
    {
        foreach (Section::active()->orderBy('name')->get() as $section) {
            $this->sectionMap[$section->program_id][$section->year_level][] = $section;
        }
    }

    private function sectionFor(int $programId, int $level, array &$counters): ?Section
    {
        $list = $this->sectionMap[$programId][$level] ?? [];
        if (empty($list)) {
            return null;
        }
        $key = "{$programId}_{$level}";
        $counters[$key] = ($counters[$key] ?? 0);
        $section = $list[$counters[$key] % count($list)];
        $counters[$key]++;

        return $section;
    }

    private function createTeacherAssignments($term, string $semester): void
    {
        $now = now();
        $rows = [];

        foreach (Section::active()->get(['id', 'program_id', 'year_level']) as $section) {
            $courses = $this->courseMap[$section->program_id][$section->year_level][$semester] ?? [];
            foreach ($courses as $course) {
                $rows[] = [
                    'academic_term_id' => $term->id,
                    'section_id'       => $section->id,
                    'course_id'        => $course['id'],
                    'teacher_id'       => $this->nextTeacher(),
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ];
            }
        }

        collect($rows)->chunk(500)->each(fn (Collection $chunk) => TeacherAssignment::upsert(
            $chunk->all(),
            ['academic_term_id', 'section_id', 'course_id'],
            ['teacher_id', 'updated_at']
        ));
    }

    private function nextTeacher(): int
    {
        $teacher = $this->teachers[$this->teacherCursor % count($this->teachers)];
        $this->teacherCursor++;

        return $teacher->id;
    }

    private function gradeFor(int $studentId, int $courseId): string
    {
        return self::PASSING_GRADES[$this->pseudo($studentId, $courseId, 3) % count(self::PASSING_GRADES)];
    }

    /**
     * General-education (minor) subjects, coded consistently across every program
     * (GEC, GE Ele, Filipino, Literature, NSTP, PE). These are the only subjects that
     * may carry INC / failed / dropped — majors are never touched.
     */
    private function isGeneralEducation(string $courseCode): bool
    {
        return Str::startsWith(Str::upper(trim($courseCode)), ['GE', 'FLG', 'LIT', 'NST', 'PED']);
    }

    private function pseudo(int $a, int $b, int $salt): int
    {
        return abs(($a * 73) + ($b * 31) + ($salt * 1009));
    }
}
