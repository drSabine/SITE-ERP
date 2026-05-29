<?php

namespace App\Services;

use App\Models\AcademicTerm;
use App\Models\EnrollmentCourse;
use InvalidArgumentException;

class GradeService
{
    // Valid transmuted grade values used by the school.
    // 5.00 = failed, null = INC (grade not yet submitted).
    public const VALID_GRADES = [1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 5.00];

    /**
     * Input or update the final grade for a single enrollment_course row.
     *
     * $grade = null  â†’ teacher explicitly marks incomplete (INC).
     * Status remains "active" â€” the term finalize step locks it.
     */
    public function inputGrade(EnrollmentCourse $ec, ?float $grade): void
    {
        if ($ec->status === 'dropped') {
            throw new InvalidArgumentException('Cannot grade a dropped course.');
        }

        if ($grade !== null && !in_array($grade, self::VALID_GRADES, strict: true)) {
            throw new InvalidArgumentException(
                'Invalid grade value: ' . $grade . '. Allowed: ' . implode(', ', self::VALID_GRADES)
            );
        }

        $ec->update(['final_grade' => $grade]);
    }

    /**
     * Coordinator override â€” sets grade AND locks status immediately.
     * Safe to call even after the term is finalized.
     */
    public function overrideGrade(EnrollmentCourse $ec, ?float $grade): void
    {
        if ($grade !== null && !in_array($grade, self::VALID_GRADES, strict: true)) {
            throw new InvalidArgumentException(
                'Invalid grade value: ' . $grade . '. Allowed: ' . implode(', ', self::VALID_GRADES)
            );
        }

        $ec->update([
            'final_grade' => $grade,
            'status'      => $this->resolveStatus($grade, $ec->status),
        ]);
    }

    /**
     * Finalize an academic term.
     *
     * Locks all still-active enrollment_courses in the term:
     *   grade not null, â‰¤ 3.00  â†’ status = "passed"
     *   grade = 5.00             â†’ status = "failed"
     *   grade = null             â†’ status = "inc"
     *
     * Already dropped / passed / failed / inc rows are untouched.
     * Marks the term itself as inactive.
     */
    public function finalizeTerm(AcademicTerm $term): void
    {
        $term->enrollments()
            ->with('enrollmentCourses')
            ->get()
            ->each(function ($enrollment) {
                $enrollment->enrollmentCourses
                    ->where('status', 'active')
                    ->each(function (EnrollmentCourse $ec) {
                        $ec->update([
                            'status' => $this->resolveStatus($ec->final_grade, 'active'),
                        ]);
                    });
            });

        $term->update(['is_active' => false]);
    }

    // -------------------------------------------------------------------------

    private function resolveStatus(?float $grade, string $currentStatus): string
    {
        if ($currentStatus === 'dropped') {
            return 'dropped';
        }
        if ($grade === null) {
            return 'inc';
        }
        return $grade <= 3.00 ? 'passed' : 'failed';
    }
}
