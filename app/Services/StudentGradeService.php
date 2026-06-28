<?php

namespace App\Services;

use App\Models\Student;
use Illuminate\Support\Collection;

class StudentGradeService
{
    private const SEMESTER_ORDER = ['first' => 1, 'second' => 2, 'summer' => 3];

    /**
     * Full academic history grouped by term, with per-term and overall GWA.
     * GWA is unit-weighted over courses that carry a numeric grade (lower is better).
     */
    public function transcript(Student $student): array
    {
        $enrollments = $student->enrollments()
            ->with([
                'academicTerm' => fn ($query) => $query
                    ->select('id', 'school_year_id', 'semester', 'is_active')
                    ->with('schoolYear:id,name'),
                'enrollmentCourses' => fn ($query) => $query
                    ->with('course:id,course_code,title,units')
                    ->select('id', 'enrollment_id', 'course_id', 'final_grade', 'status'),
            ])
            ->get();

        $terms = $enrollments->map(function ($enrollment) {
            $courses = $enrollment->enrollmentCourses
                ->reject(fn ($ec) => $ec->status === 'dropped')
                ->map(fn ($ec) => [
                    'course_code' => $ec->course?->course_code,
                    'title'       => $ec->course?->title,
                    'units'       => (int) ($ec->course?->units ?? 0),
                    'final_grade' => $ec->final_grade !== null ? (float) $ec->final_grade : null,
                    'status'      => $ec->status,
                ])
                ->sortBy('course_code')
                ->values();

            return [
                'enrollment_id' => $enrollment->id,
                'school_year'   => $enrollment->academicTerm?->schoolYear?->name,
                'semester'      => $enrollment->academicTerm?->semester,
                'is_active'     => (bool) $enrollment->academicTerm?->is_active,
                'year_level'    => $enrollment->year_level,
                'status'        => $enrollment->status,
                'courses'       => $courses->all(),
                'gwa'           => $this->gwa($courses),
                'inc_count'     => $courses->where('status', 'inc')->count(),
            ];
        })
        ->sortBy(fn ($term) => sprintf('%s-%d', $term['school_year'] ?? '', self::SEMESTER_ORDER[$term['semester']] ?? 9))
        ->values();

        $allCourses = $terms->flatMap(fn ($term) => $term['courses']);

        return [
            'terms'      => $terms->all(),
            'overallGwa' => $this->gwa($allCourses),
        ];
    }

    /**
     * GWA = Σ(grade × units) ÷ Σ(units) across the term's graded subjects.
     *
     * "Units taken" here means the units that actually carry a grade — a subject only
     * enters both the numerator and the denominator once it has a numeric final grade.
     * INC / in-progress (ungraded) subjects are excluded so they don't distort the average;
     * they fold into the GWA automatically once a grade is entered.
     */
    private function gwa(Collection $courses): ?float
    {
        $graded = $courses->filter(fn ($course) => $course['final_grade'] !== null && $course['units'] > 0);
        $totalUnits = $graded->sum('units');

        if ($totalUnits === 0) {
            return null;
        }

        $weightedSum = $graded->sum(fn ($course) => $course['final_grade'] * $course['units']);

        return round($weightedSum / $totalUnits, 2);
    }
}
