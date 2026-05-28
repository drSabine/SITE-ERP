<?php

namespace App\Services;

use App\Models\AcademicTerm;
use App\Models\EnrollmentCourse;
use App\Models\Grade;
use App\Models\TermPeriod;
use Illuminate\Validation\ValidationException;

class GradeService
{
    // Valid transmuted grade values in Philippine college grading system
    public const VALID_GRADES = [1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 5.00];

    /**
     * Input or update a grade for a specific enrollment_course + term_period.
     * Grade must be a valid value or null (null = INC for this period).
     */
    public function inputGrade(
        EnrollmentCourse $enrollmentCourse,
        TermPeriod $termPeriod,
        ?float $grade
    ): Grade {
        if ($grade !== null && ! in_array($grade, self::VALID_GRADES)) {
            throw ValidationException::withMessages([
                'grade' => 'Invalid grade value. Must be one of: ' . implode(', ', self::VALID_GRADES),
            ]);
        }

        return Grade::updateOrCreate(
            [
                'enrollment_course_id' => $enrollmentCourse->id,
                'term_period_id'       => $termPeriod->id,
            ],
            ['grade' => $grade]
        );
    }

    /**
     * Finalize all enrollment_courses for an academic term.
     * Computes final_grade from period grades and sets status.
     * Called by admin/coordinator when the Finals period closes.
     */
    public function finalizeTerm(AcademicTerm $term): void
    {
        $termPeriods = $term->termPeriods()->pluck('id', 'period');

        $enrollmentCourses = EnrollmentCourse::whereHas(
            'enrollment',
            fn($q) => $q->where('academic_term_id', $term->id)->where('status', 'enrolled')
        )->where('status', 'active')->get();

        foreach ($enrollmentCourses as $ec) {
            $this->computeFinalGrade($ec, $termPeriods);
        }
    }

    /**
     * Compute and store final_grade for a single enrollment_course.
     * Called individually for INC resolution.
     */
    public function computeFinalGrade(EnrollmentCourse $ec, $termPeriods = null): void
    {
        if ($termPeriods === null) {
            $termPeriods = $ec->enrollment->academicTerm->termPeriods()->pluck('id', 'period');
        }

        $grades = Grade::where('enrollment_course_id', $ec->id)
            ->whereIn('term_period_id', $termPeriods->values())
            ->pluck('grade', 'enrollment_course_id');

        // Re-fetch keyed by term_period_id
        $gradesByPeriod = Grade::where('enrollment_course_id', $ec->id)
            ->whereIn('term_period_id', $termPeriods->values())
            ->pluck('grade', 'term_period_id');

        $prelim  = $gradesByPeriod[$termPeriods['preliminary'] ?? null] ?? null;
        $midterm = $gradesByPeriod[$termPeriods['midterm'] ?? null] ?? null;
        $finals  = $gradesByPeriod[$termPeriods['finals'] ?? null] ?? null;

        // Any null period = INC
        if ($prelim === null || $midterm === null || $finals === null) {
            $ec->update(['final_grade' => null, 'status' => 'inc']);
            return;
        }

        // Weighted average: Prelim 30% + Midterm 30% + Finals 40%
        $weighted = ($prelim * 0.30) + ($midterm * 0.30) + ($finals * 0.40);

        $finalGrade = $this->roundToValidGrade($weighted);

        $status = $finalGrade <= 3.00 ? 'passed' : 'failed';

        $ec->update(['final_grade' => $finalGrade, 'status' => $status]);
    }

    /**
     * Override final_grade manually (INC resolution or correction).
     * Coordinator/admin only.
     */
    public function overrideFinalGrade(EnrollmentCourse $ec, float $grade): void
    {
        if (! in_array($grade, self::VALID_GRADES)) {
            throw ValidationException::withMessages([
                'final_grade' => 'Invalid grade value.',
            ]);
        }

        $status = $grade <= 3.00 ? 'passed' : 'failed';
        $ec->update(['final_grade' => $grade, 'status' => $status]);
    }

    /**
     * Round a raw weighted average to the nearest valid grade step.
     */
    private function roundToValidGrade(float $raw): float
    {
        // If above 3.0, it's a failing grade
        if ($raw > 3.0) {
            return 5.00;
        }

        // Find nearest valid passing grade step
        $passing = [1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00];
        $nearest = $passing[0];
        $minDiff = abs($raw - $passing[0]);

        foreach ($passing as $step) {
            $diff = abs($raw - $step);
            if ($diff < $minDiff) {
                $minDiff = $diff;
                $nearest = $step;
            }
        }

        return $nearest;
    }
}
