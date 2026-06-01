<?php

namespace App\Services;

use App\Models\AcademicTerm;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\EnrollmentCourse;
use App\Models\SchoolYear;
use App\Models\Student;
use Illuminate\Validation\ValidationException;

class EnrollmentService
{
    public const MAX_UNITS = 26;

    /**
     * Enroll a student in an academic term.
     */
    public function enroll(Student $student, AcademicTerm $term, int $yearLevel): Enrollment
    {
        $existing = Enrollment::where('student_id', $student->id)
            ->where('academic_term_id', $term->id)
            ->first();

        if ($existing) {
            if ($existing->status === 'dropped') {
                $existing->update([
                    'year_level'  => $yearLevel,
                    'status'      => 'enrolled',
                    'dropped_at'  => null,
                    'enrolled_at' => now(),
                ]);

                return $existing->fresh();
            }

            throw ValidationException::withMessages([
                'student_id' => 'Student is already enrolled in this term.',
            ]);
        }

        return Enrollment::create([
            'student_id'       => $student->id,
            'academic_term_id' => $term->id,
            'year_level'       => $yearLevel,
            'status'           => 'enrolled',
            'enrolled_at'      => now(),
        ]);
    }

    /**
     * Enroll a student in every semester of a school year at once.
     * Skips terms the student is already enrolled in.
     * Returns the count of new enrollment records created.
     */
    public function enrollForSchoolYear(
        Student $student,
        SchoolYear $schoolYear,
        int $yearLevel,
        bool $includeSummer = false,
        bool $loadCurriculum = true
    ): int {
        $terms = $schoolYear->academicTerms()
            ->when(! $includeSummer, fn ($q) => $q->where('semester', '!=', 'summer'))
            ->orderByRaw("FIELD(semester, 'first', 'second', 'summer')")
            ->get();

        $created = 0;

        foreach ($terms as $term) {
            if (Enrollment::where('student_id', $student->id)
                ->where('academic_term_id', $term->id)
                ->exists()
            ) {
                continue;
            }

            $enrollment = Enrollment::create([
                'student_id'       => $student->id,
                'academic_term_id' => $term->id,
                'year_level'       => $yearLevel,
                'status'           => 'enrolled',
                'enrolled_at'      => now(),
            ]);

            if ($loadCurriculum) {
                try {
                    $this->loadStandardCurriculum($enrollment);
                } catch (\Throwable $throwable) {
                    // Curriculum load failure is non-fatal
                }
            }

            $created++;
        }

        return $created;
    }

    /**
     * Check whether enrolling a student at $targetYearLevel would skip any year levels
     * that have no enrollment on record.
     */
    public function detectYearLevelGap(Student $student, int $targetYearLevel): bool
    {
        if ($targetYearLevel <= 1) {
            return false;
        }

        $existing = Enrollment::where('student_id', $student->id)
            ->pluck('year_level')
            ->unique()
            ->values()
            ->all();

        for ($level = 1; $level < $targetYearLevel; $level++) {
            if (! in_array($level, $existing)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Return all outstanding INC enrollment_courses for a student.
     */
    public function getStudentIncCourses(Student $student): \Illuminate\Support\Collection
    {
        return EnrollmentCourse::where('status', 'inc')
            ->whereHas('enrollment', fn ($q) => $q->where('student_id', $student->id))
            ->with([
                'course:id,course_code,title',
                'enrollment' => fn ($q) => $q->with(['academicTerm:id,semester,school_year_id'])
                                            ->select('id', 'academic_term_id'),
            ])
            ->get(['id', 'enrollment_id', 'course_id', 'status']);
    }

    /**
     * Auto-populate courses from the standard curriculum for the student's
     * program + year level + this term's semester type.
     * Returns the number of courses added.
     */
    public function loadStandardCurriculum(Enrollment $enrollment): int
    {
        $enrollment->load(['academicTerm', 'student']);

        $courses = Course::active()
            ->where('program_id', $enrollment->student->program_id)
            ->forSemester($enrollment->year_level, $enrollment->academicTerm->semester)
            ->get(['id', 'units']);

        if ($courses->isEmpty()) {
            return 0;
        }

        $toAdd = [];
        $currentUnits = $this->currentUnits($enrollment);

        foreach ($courses as $course) {
            // Skip courses already in the load
            if (EnrollmentCourse::where('enrollment_id', $enrollment->id)
                ->where('course_id', $course->id)->exists()
            ) {
                continue;
            }

            if (($currentUnits + $course->units) > self::MAX_UNITS) {
                continue;
            }

            $toAdd[] = [
                'enrollment_id' => $enrollment->id,
                'course_id'     => $course->id,
                'status'        => 'active',
                'created_at'    => now(),
                'updated_at'    => now(),
            ];

            $currentUnits += $course->units;
        }

        if (! empty($toAdd)) {
            EnrollmentCourse::insert($toAdd);
        }

        return count($toAdd);
    }

    /**
     * Return prerequisite courses of $course that the student has not yet passed.
     * Returns an array of human-readable strings: ["COURSE_CODE — Title", ...]
     * An empty array means all prerequisites are satisfied.
     */
    public function getUnmetPrerequisites(Enrollment $enrollment, Course $course): array
    {
        $prerequisites = $course->prerequisites()
            ->wherePivot('type', 'prerequisite')
            ->select('courses.id', 'courses.course_code', 'courses.title')
            ->get();

        if ($prerequisites->isEmpty()) {
            return [];
        }

        $passedCourseIds = EnrollmentCourse::whereIn('status', ['passed', 'credited'])
            ->whereHas('enrollment', fn ($query) => $query->where('student_id', $enrollment->student_id))
            ->pluck('course_id')
            ->all();

        return $prerequisites
            ->filter(fn ($prereq) => ! in_array($prereq->id, $passedCourseIds))
            ->map(fn ($prereq) => "{$prereq->course_code} — {$prereq->title}")
            ->values()
            ->all();
    }

    /**
     * Add a single course to an enrollment. Enforces the 26-unit cap.
     */
    public function addCourse(Enrollment $enrollment, Course $course): EnrollmentCourse
    {
        if (EnrollmentCourse::where('enrollment_id', $enrollment->id)
            ->where('course_id', $course->id)
            ->whereIn('status', ['active', 'inc'])
            ->exists()
        ) {
            throw ValidationException::withMessages([
                'course_id' => 'This course is already in the student\'s load.',
            ]);
        }

        $currentUnits = $this->currentUnits($enrollment);

        if (($currentUnits + $course->units) > self::MAX_UNITS) {
            throw ValidationException::withMessages([
                'course_id' => "Adding this course ({$course->units} units) would exceed the 26-unit maximum. Current: {$currentUnits} units.",
            ]);
        }

        return EnrollmentCourse::create([
            'enrollment_id' => $enrollment->id,
            'course_id'     => $course->id,
            'status'        => 'active',
        ]);
    }

    /**
     * Remove (drop) a course from an enrollment.
     * Credited courses are hard-deleted (no history to preserve).
     * All others are soft-dropped to preserve grading history.
     */
    public function removeCourse(EnrollmentCourse $enrollmentCourse): void
    {
        if ($enrollmentCourse->status === 'credited') {
            $enrollmentCourse->delete();
        } else {
            $enrollmentCourse->update(['status' => 'dropped']);
        }
    }

    /**
     * Credit a course for a transferee. Creates an enrollment_course with status 'credited'.
     * Credited courses satisfy pre-req checks without the student having taken the course here.
     */
    public function creditCourse(Enrollment $enrollment, Course $course): EnrollmentCourse
    {
        if (EnrollmentCourse::where('enrollment_id', $enrollment->id)
            ->where('course_id', $course->id)
            ->exists()
        ) {
            throw ValidationException::withMessages([
                'course_id' => 'This course is already in the student\'s enrollment.',
            ]);
        }

        return EnrollmentCourse::create([
            'enrollment_id' => $enrollment->id,
            'course_id'     => $course->id,
            'status'        => 'credited',
        ]);
    }

    /**
     * Restore a previously dropped course back to active status.
     */
    public function restoreCourse(EnrollmentCourse $enrollmentCourse): void
    {
        $enrollmentCourse->update(['status' => 'active']);
    }

    /**
     * Drop an entire enrollment (student withdraws for the semester).
     */
    public function dropEnrollment(Enrollment $enrollment): void
    {
        $enrollment->update([
            'status'     => 'dropped',
            'dropped_at' => now(),
        ]);
    }

    private function currentUnits(Enrollment $enrollment): int
    {
        return EnrollmentCourse::where('enrollment_id', $enrollment->id)
            ->whereIn('status', ['active', 'inc'])
            ->join('courses', 'courses.id', '=', 'enrollment_courses.course_id')
            ->sum('courses.units');
    }
}
