<?php

namespace App\Services;

use App\Models\BoardExamResult;
use App\Models\Program;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Services\BoardExamService;
use Illuminate\Support\Facades\DB;

class DashboardAnalyticsService
{
    public function adminAnalytics(): array
    {
        return [
            'schoolYearEvaluationTrend' => $this->schoolYearEvaluationTrend(),
            'programDistribution'       => $this->programDistribution(),
            'evaluationOutcomeTrend'    => $this->evaluationOutcomeTrend(),
            'graduateTrend'             => $this->graduateTrend(),
        ];
    }

    /**
     * Graduates per school year (last 3) plus a "needed to grow" target.
     * Target = previous school year's graduates + 1; gray bar = max(0, target − graduates),
     * so stacking the gray on the solid reaches the year-over-year growth goal.
     */
    public function graduateTrend(): array
    {
        $gradCounts = Student::where('status', 'graduated')
            ->whereNotNull('graduated_school_year_id')
            ->selectRaw('graduated_school_year_id, count(*) as total')
            ->groupBy('graduated_school_year_id')
            ->pluck('total', 'graduated_school_year_id');

        // Chronological (oldest → newest) so "previous year" is the element before.
        $ordered = SchoolYear::ordered()->get(['id', 'name'])->reverse()->values();

        $rows = [];
        $previousGraduates = 0;
        foreach ($ordered as $schoolYear) {
            $graduates = (int) ($gradCounts[$schoolYear->id] ?? 0);
            $target = $previousGraduates + 1;
            $rows[] = [
                'schoolYear' => $schoolYear->name,
                'graduates'  => $graduates,
                'target'     => $target,
                'needed'     => max(0, $target - $graduates),
            ];
            $previousGraduates = $graduates;
        }

        return array_slice($rows, -3);
    }

    /**
     * INC / deficiency analytics scoped to a coordinator's programs.
     * Pass the coordinator's program codes (null = unscoped / all programs).
     */
    public function coordinatorAnalytics(?array $programCodes): array
    {
        $programIds = $programCodes !== null
            ? Program::whereIn('code', $programCodes)->pluck('id')->all()
            : null;

        return [
            'incTrend'     => $this->incTrendBySchoolYear($programIds),
            'incByProgram' => $this->incByProgram($programIds),
            'summary'      => $this->incSummary($programIds),
        ];
    }

    private function incTrendBySchoolYear(?array $programIds): array
    {
        return SchoolYear::query()
            ->ordered()
            ->leftJoin('academic_terms', 'academic_terms.school_year_id', '=', 'school_years.id')
            ->leftJoin('enrollments', function ($join) use ($programIds) {
                $join->on('enrollments.academic_term_id', '=', 'academic_terms.id');
                if ($programIds !== null) {
                    $join->whereIn('enrollments.program_id', $programIds);
                }
            })
            ->leftJoin('enrollment_courses', function ($join) {
                $join->on('enrollment_courses.enrollment_id', '=', 'enrollments.id')
                    ->where('enrollment_courses.status', '=', 'inc');
            })
            ->select('school_years.id', 'school_years.name')
            ->selectRaw('COUNT(enrollment_courses.id) as inc_count')
            ->groupBy('school_years.id', 'school_years.name')
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($schoolYear) => [
                'schoolYear' => $schoolYear->name,
                'inc'        => (int) $schoolYear->inc_count,
            ])
            ->all();
    }

    private function incByProgram(?array $programIds): array
    {
        $activeSchoolYear = SchoolYear::active()->first(['id']);

        if (! $activeSchoolYear) {
            return [];
        }

        return DB::table('enrollment_courses')
            ->join('enrollments', 'enrollments.id', '=', 'enrollment_courses.enrollment_id')
            ->join('academic_terms', 'academic_terms.id', '=', 'enrollments.academic_term_id')
            ->join('programs', 'programs.id', '=', 'enrollments.program_id')
            ->where('academic_terms.school_year_id', $activeSchoolYear->id)
            ->where('enrollment_courses.status', 'inc')
            ->when($programIds !== null, fn ($query) => $query->whereIn('enrollments.program_id', $programIds))
            ->groupBy('programs.code')
            ->orderBy('programs.code')
            ->selectRaw('programs.code, COUNT(*) as inc_count')
            ->get()
            ->map(fn ($row) => ['program' => $row->code, 'inc' => (int) $row->inc_count])
            ->all();
    }

    private function incSummary(?array $programIds): array
    {
        $activeSchoolYear = SchoolYear::active()->first(['id']);

        if (! $activeSchoolYear) {
            return ['totalInc' => 0, 'evaluatedStudents' => 0, 'avgIncPerStudent' => 0];
        }

        $base = DB::table('enrollments')
            ->join('academic_terms', 'academic_terms.id', '=', 'enrollments.academic_term_id')
            ->where('academic_terms.school_year_id', $activeSchoolYear->id)
            ->when($programIds !== null, fn ($query) => $query->whereIn('enrollments.program_id', $programIds));

        $evaluatedStudents = (clone $base)
            ->whereIn('enrollments.status', ['enrolled', 'completed'])
            ->distinct()
            ->count('enrollments.student_id');

        $totalInc = (clone $base)
            ->join('enrollment_courses', 'enrollment_courses.enrollment_id', '=', 'enrollments.id')
            ->where('enrollment_courses.status', 'inc')
            ->count();

        return [
            'totalInc'          => (int) $totalInc,
            'evaluatedStudents' => (int) $evaluatedStudents,
            'avgIncPerStudent'  => $evaluatedStudents > 0 ? round($totalInc / $evaluatedStudents, 2) : 0,
        ];
    }

    /**
     * Engineering board/licensure exam analytics for the dashboard.
     * Scoped to engineering programs (the only programs that record board exams).
     * Intakes are aggregated per year+month across scoped programs and returned
     * chronologically so the bar/line trend reads oldest -> newest.
     */
    public function boardExamAnalytics(): array
    {
        $records = BoardExamResult::query()
            ->whereIn('program_id', Program::whereIn('code', BoardExamService::ENGINEERING_CODES)->pluck('id'))
            ->get();

        $intakeTrend = $records
            ->groupBy(fn ($result) => sprintf('%04d-%02d', $result->exam_year, $result->exam_month))
            ->map(function ($group) {
                $firstTakers    = (int) $group->sum('first_takers');
                $firstPassers   = (int) $group->sum('first_taker_passers');
                $retakers       = (int) $group->sum('retakers');
                $retakerPassers = (int) $group->sum('retaker_passers');

                $takers     = $firstTakers + $retakers;
                $passers    = $firstPassers + $retakerPassers;
                $didNotPass = $takers - $passers;
                $first      = $group->first();

                return [
                    'year'           => $first->exam_year,
                    'month'          => $first->exam_month,
                    'label'          => substr(BoardExamService::MONTHS[$first->exam_month], 0, 3) . " {$first->exam_year}",
                    'takers'         => $takers,
                    'passers'        => $passers,
                    'didNotPass'     => $didNotPass,
                    'firstTakers'    => $firstTakers,
                    'retakers'       => $retakers,
                    'passRate'       => $takers > 0 ? round($passers / $takers * 100, 1) : 0,
                    'firstTakerRate' => $firstTakers > 0 ? round($firstPassers / $firstTakers * 100, 1) : 0,
                    'retakerRate'    => $retakers > 0 ? round($retakerPassers / $retakers * 100, 1) : 0,
                    'pctFirstTakers' => $takers > 0 ? round($firstTakers / $takers * 100, 1) : 0,
                    'pctRetakers'    => $takers > 0 ? round($retakers / $takers * 100, 1) : 0,
                ];
            })
            ->sortBy(fn ($row) => sprintf('%04d%02d', $row['year'], $row['month']))
            ->values()
            ->all();

        $totalTakers     = (int) $records->sum(fn ($result) => $result->total_takers);
        $totalPassers    = (int) $records->sum(fn ($result) => $result->total_passers);
        $totalFirst      = (int) $records->sum('first_takers');
        $totalFirstPass  = (int) $records->sum('first_taker_passers');
        $totalRetakers   = (int) $records->sum('retakers');
        $totalRetakePass = (int) $records->sum('retaker_passers');

        return [
            'intakeTrend' => $intakeTrend,
            'summary'     => [
                'totalTakers'    => $totalTakers,
                'totalPassers'   => $totalPassers,
                'didNotPass'     => $totalTakers - $totalPassers,
                'passRate'       => $totalTakers > 0 ? round($totalPassers / $totalTakers * 100, 1) : 0,
                'firstTakerRate' => $totalFirst > 0 ? round($totalFirstPass / $totalFirst * 100, 1) : 0,
                'retakerRate'    => $totalRetakers > 0 ? round($totalRetakePass / $totalRetakers * 100, 1) : 0,
                'intakeCount'    => count($intakeTrend),
            ],
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

    /**
     * Return student counts per program and year level for the active school year.
     * BSCE counts are negated so the frontend can render a population-pyramid layout
     * (BSIT bars go right, BSCE bars go left).
     */
    public function programDistribution(): array
    {
        $activeSchoolYear = SchoolYear::active()->first(['id']);

        if (! $activeSchoolYear) {
            return [];
        }

        $rows = \Illuminate\Support\Facades\DB::table('school_years')
            ->where('school_years.id', $activeSchoolYear->id)
            ->join('academic_terms', 'academic_terms.school_year_id', '=', 'school_years.id')
            ->join('enrollments', function ($join) {
                $join->on('enrollments.academic_term_id', '=', 'academic_terms.id')
                    ->whereIn('enrollments.status', ['enrolled', 'completed']);
            })
            ->join('programs', 'programs.id', '=', 'enrollments.program_id')
            ->selectRaw('programs.code, enrollments.year_level, COUNT(DISTINCT enrollments.student_id) as student_count')
            ->groupBy('programs.code', 'enrollments.year_level')
            ->orderBy('enrollments.year_level')
            ->get();

        $yearLabels = [1 => '1st Year', 2 => '2nd Year', 3 => '3rd Year', 4 => '4th Year', 5 => '5th Year'];

        return $rows->pluck('year_level')->unique()->sort()->values()
            ->map(function ($level) use ($rows, $yearLabels) {
                $bsitRow = $rows->first(fn ($row) => $row->year_level == $level && $row->code === 'BSIT');
                $bsceRow = $rows->first(fn ($row) => $row->year_level == $level && $row->code === 'BSCE');

                return [
                    'yearLevel' => $yearLabels[$level] ?? "Year {$level}",
                    'bsit'      => $bsitRow ? (int) $bsitRow->student_count : 0,
                    'bsce'      => $bsceRow ? -(int) $bsceRow->student_count : 0,
                ];
            })
            ->values()
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
