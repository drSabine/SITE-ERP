<?php

namespace App\Services;

use App\Models\SchoolYear;

class DashboardAnalyticsService
{
    public function adminAnalytics(): array
    {
        return [
            'schoolYearEvaluationTrend' => $this->schoolYearEvaluationTrend(),
            'programDistribution'       => $this->programDistribution(),
            'evaluationOutcomeTrend'    => $this->evaluationOutcomeTrend(),
        ];
    }

    public function schoolYearEvaluationTrend(): array
    {
        return SchoolYear::query()
            ->ordered()
            ->leftJoin('academic_terms', 'academic_terms.school_year_id', '=', 'school_years.id')
            ->leftJoin('enrollments', function ($join) {
                $join->on('enrollments.academic_term_id', '=', 'academic_terms.id')
                    ->whereIn('enrollments.status', ['enrolled', 'completed']);
            })
            ->select('school_years.id', 'school_years.name')
            ->selectRaw('COUNT(DISTINCT enrollments.student_id) as evaluated_students')
            ->groupBy('school_years.id', 'school_years.name')
            ->get()
            ->reverse()
            ->values()
            ->map(fn($schoolYear) => [
                'schoolYear'         => $schoolYear->name,
                'evaluatedStudents'  => (int) $schoolYear->evaluated_students,
            ])
            ->all();
    }

    public function programDistribution(): array
    {
        $activeSchoolYear = SchoolYear::active()->first(['id']);

        if (! $activeSchoolYear) {
            return [];
        }

        return SchoolYear::query()
            ->where('school_years.id', $activeSchoolYear->id)
            ->join('academic_terms', 'academic_terms.school_year_id', '=', 'school_years.id')
            ->join('enrollments', function ($join) {
                $join->on('enrollments.academic_term_id', '=', 'academic_terms.id')
                    ->whereIn('enrollments.status', ['enrolled', 'completed']);
            })
            ->join('programs', 'programs.id', '=', 'enrollments.program_id')
            ->select('programs.code')
            ->selectRaw('COUNT(DISTINCT enrollments.student_id) as student_count')
            ->groupBy('programs.id', 'programs.code')
            ->orderBy('programs.code')
            ->get()
            ->map(fn($program) => [
                'program'  => $program->code,
                'students' => (int) $program->student_count,
            ])
            ->all();
    }

    public function evaluationOutcomeTrend(): array
    {
        return SchoolYear::query()
            ->ordered()
            ->leftJoin('academic_terms', 'academic_terms.school_year_id', '=', 'school_years.id')
            ->leftJoin('enrollments', 'enrollments.academic_term_id', '=', 'academic_terms.id')
            ->leftJoin('enrollment_courses', 'enrollment_courses.enrollment_id', '=', 'enrollments.id')
            ->select('school_years.id', 'school_years.name')
            ->selectRaw("SUM(CASE WHEN enrollment_courses.status = 'passed' THEN 1 ELSE 0 END) as passed")
            ->selectRaw("SUM(CASE WHEN enrollment_courses.status = 'failed' THEN 1 ELSE 0 END) as failed")
            ->selectRaw("SUM(CASE WHEN enrollment_courses.status = 'inc' THEN 1 ELSE 0 END) as inc")
            ->selectRaw("SUM(CASE WHEN enrollment_courses.status = 'dropped' THEN 1 ELSE 0 END) as dropped")
            ->groupBy('school_years.id', 'school_years.name')
            ->get()
            ->reverse()
            ->values()
            ->map(fn($schoolYear) => [
                'schoolYear' => $schoolYear->name,
                'passed'     => (int) $schoolYear->passed,
                'failed'     => (int) $schoolYear->failed,
                'inc'        => (int) $schoolYear->inc,
                'dropped'    => (int) $schoolYear->dropped,
            ])
            ->all();
    }
}
