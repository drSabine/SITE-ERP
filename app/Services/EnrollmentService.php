<?php

namespace App\Services;

use App\Models\AcademicTerm;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\EnrollmentCourse;
use App\Models\Student;
use Illuminate\Validation\ValidationException;

class EnrollmentService
{
    public const MAX_UNITS = 26;

    /**
     * Enroll a student in an academic term.
     */
    public function enroll(Student $student, AcademicTerm $term): Enrollment
    {
        if (Enrollment::where('student_id', $student->id)
            ->where('academic_term_id', $term->id)
            ->exists()
        ) {
            throw ValidationException::withMessages([
                'student_id' => 'Student is already enrolled in this term.',
            ]);
        }

        return Enrollment::create([
            'student_id'      => $student->id,
            'academic_term_id' => $term->id,
            'status'          => 'enrolled',
            'enrolled_at'     => now(),
        ]);
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
            ->forSemester($enrollment->student->year_level, $enrollment->academicTerm->semester)
            ->get(['id', 'units']);

        if ($courses->isEmpty()) {
            return 0;
        }

        $currentUnits = $this->currentUnits($enrollment);
        $toAdd = [];

        foreach ($courses as $course) {
            // Skip courses already in the load
            if (EnrollmentCourse::where('enrollment_id', $enrollment->id)
                ->where('course_id', $course->id)->exists()
            ) {
                continue;
            }

            $currentUnits += $course->units;

            if ($currentUnits > self::MAX_UNITS) {
                throw ValidationException::withMessages([
                    'units' => "Adding the standard curriculum would exceed the {$currentUnits} unit maximum.",
                ]);
            }

            $toAdd[] = [
                'enrollment_id' => $enrollment->id,
                'course_id'     => $course->id,
                'status'        => 'active',
                'created_at'    => now(),
                'updated_at'    => now(),
            ];
        }

        if (! empty($toAdd)) {
            EnrollmentCourse::insert($toAdd);
        }

        return count($toAdd);
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
     * Soft-drop: set status to dropped instead of deleting, to preserve history.
     */
    public function removeCourse(EnrollmentCourse $enrollmentCourse): void
    {
        $enrollmentCourse->update(['status' => 'dropped']);
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
