<?php

namespace App\Services;

use App\Models\PassingRate;
use Illuminate\Support\Facades\DB;

class PassingRateService
{
    private static array $monthNames = [
        1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr',
        5 => 'May', 6 => 'Jun', 7 => 'Jul', 8 => 'Aug',
        9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec',
    ];

    public function getAnalytics(): array
    {
        return [
            'trend'             => $this->trend(),
            'programComparison' => $this->programComparison(),
            'summaryStats'      => $this->summaryStats(),
        ];
    }

    /**
     * Passing rate % per exam period per program, sorted chronologically.
     * Shape: [{ period, <programCode>, ... }, ...]
     */
    public function trend(): array
    {
        $rows = DB::table('passing_rates')
            ->join('programs', 'programs.id', '=', 'passing_rates.program_id')
            ->select('programs.code as program_code', 'exam_month', 'exam_year')
            ->selectRaw('ROUND(SUM(passers_count) * 100.0 / NULLIF(SUM(total_takers), 0), 1) as rate')
            ->groupBy('programs.code', 'exam_month', 'exam_year')
            ->orderBy('exam_year')
            ->orderBy('exam_month')
            ->get();

        // Pivot rows into period-keyed objects
        $periods = [];
        foreach ($rows as $row) {
            $period = self::$monthNames[$row->exam_month] . ' ' . $row->exam_year;
            if (! isset($periods[$period])) {
                $periods[$period] = ['period' => $period];
            }
            $code = strtolower($row->program_code);
            $periods[$period][$code] = (float) $row->rate;
        }

        return array_values($periods);
    }

    /**
     * Average pass rate per program per year.
     * Shape: [{ year, <programCode>, ... }, ...]
     */
    public function programComparison(): array
    {
        $rows = DB::table('passing_rates')
            ->join('programs', 'programs.id', '=', 'passing_rates.program_id')
            ->select('programs.code as program_code', 'exam_year')
            ->selectRaw('ROUND(SUM(passers_count) * 100.0 / NULLIF(SUM(total_takers), 0), 1) as rate')
            ->groupBy('programs.code', 'exam_year')
            ->orderBy('exam_year')
            ->get();

        $years = [];
        foreach ($rows as $row) {
            $year = (string) $row->exam_year;
            if (! isset($years[$year])) {
                $years[$year] = ['year' => $year];
            }
            $code = strtolower($row->program_code);
            $years[$year][$code] = (float) $row->rate;
        }

        return array_values($years);
    }

    public function summaryStats(): array
    {
        $stats = DB::table('passing_rates')
            ->selectRaw('COUNT(*) as total_records')
            ->selectRaw('ROUND(SUM(passers_count) * 100.0 / NULLIF(SUM(total_takers), 0), 1) as overall_rate')
            ->first();

        $highest = DB::table('passing_rates')
            ->join('programs', 'programs.id', '=', 'passing_rates.program_id')
            ->selectRaw('programs.code as program_code, exam_month, exam_year, ROUND(passers_count * 100.0 / NULLIF(total_takers, 0), 1) as rate')
            ->orderByDesc('rate')
            ->first();

        $lowest = DB::table('passing_rates')
            ->join('programs', 'programs.id', '=', 'passing_rates.program_id')
            ->selectRaw('programs.code as program_code, exam_month, exam_year, ROUND(passers_count * 100.0 / NULLIF(total_takers, 0), 1) as rate')
            ->orderBy('rate')
            ->first();

        return [
            'totalRecords'  => (int) ($stats->total_records ?? 0),
            'overallRate'   => $stats ? (float) $stats->overall_rate : 0.0,
            'highest'       => $highest ? [
                'rate'    => (float) $highest->rate,
                'program' => $highest->program_code,
                'period'  => self::$monthNames[$highest->exam_month] . ' ' . $highest->exam_year,
            ] : null,
            'lowest'        => $lowest ? [
                'rate'    => (float) $lowest->rate,
                'program' => $lowest->program_code,
                'period'  => self::$monthNames[$lowest->exam_month] . ' ' . $lowest->exam_year,
            ] : null,
        ];
    }

    /**
     * Latest pass rate per program for the Dashboard preview widget.
     * Shape: [{ programCode, rate, period }, ...]
     */
    public function getDashboardPreview(): array
    {
        // Get the most recent exam period (by year+month) for each program
        $latest = DB::table('passing_rates')
            ->join('programs', 'programs.id', '=', 'passing_rates.program_id')
            ->select('programs.id as program_id', 'programs.code as program_code')
            ->selectRaw('MAX(exam_year * 100 + exam_month) as latest_period_key')
            ->groupBy('programs.id', 'programs.code')
            ->get();

        $preview = [];
        foreach ($latest as $item) {
            $year = (int) floor($item->latest_period_key / 100);
            $month = $item->latest_period_key % 100;

            $rate = DB::table('passing_rates')
                ->where('program_id', $item->program_id)
                ->where('exam_year', $year)
                ->where('exam_month', $month)
                ->selectRaw('ROUND(SUM(passers_count) * 100.0 / NULLIF(SUM(total_takers), 0), 1) as rate')
                ->value('rate');

            $preview[] = [
                'programCode' => $item->program_code,
                'rate'        => (float) $rate,
                'period'      => self::$monthNames[$month] . ' ' . $year,
            ];
        }

        // Also include last 4 periods for the mini chart
        $miniChart = DB::table('passing_rates')
            ->join('programs', 'programs.id', '=', 'passing_rates.program_id')
            ->select('programs.code as program_code', 'exam_month', 'exam_year')
            ->selectRaw('ROUND(SUM(passers_count) * 100.0 / NULLIF(SUM(total_takers), 0), 1) as rate')
            ->groupBy('programs.code', 'exam_month', 'exam_year')
            ->orderByDesc('exam_year')
            ->orderByDesc('exam_month')
            ->limit(20)
            ->get();

        $periods = [];
        foreach ($miniChart as $row) {
            $period = self::$monthNames[$row->exam_month] . ' ' . $row->exam_year;
            if (! isset($periods[$period])) {
                $periods[$period] = ['period' => $period];
            }
            $code = strtolower($row->program_code);
            $periods[$period][$code] = (float) $row->rate;
        }

        $miniChartData = array_slice(array_reverse(array_values($periods)), 0, 4);

        return [
            'latest'    => $preview,
            'miniChart' => $miniChartData,
        ];
    }
}
