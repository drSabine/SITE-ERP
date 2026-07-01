<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\Student;
use App\Services\BoardExamService;
use App\Services\DashboardAnalyticsService;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin-only printable reports. Each action renders a print-optimized Inertia page
 * the admin saves as PDF via the browser (window.print()) — the same dependency-free
 * approach already used for student grade sheets. No DOMPDF involved.
 */
class ReportController extends Controller
{
    public function __construct(
        private DashboardAnalyticsService $analytics,
        private BoardExamService $boardExams,
    ) {}

    /** Institutional analytics report: enrollment, population, evaluation and graduate trends. */
    public function analytics(): Response
    {
        $activeTerm = AcademicTerm::active()
            ->with(['schoolYear:id,name'])
            ->first(['id', 'school_year_id', 'semester', 'is_active']);

        return Inertia::render('Admin/Reports/Analytics', [
            'generatedAt'   => now()->toIso8601String(),
            'activeTerm'    => $activeTerm,
            'studentCount'  => Student::active()->count(),
            'enrolledCount' => $activeTerm
                ? $activeTerm->enrollments()->where('status', 'enrolled')->count()
                : 0,
            'analytics'     => $this->analytics->adminAnalytics(),
        ]);
    }

    /** Board-exam (engineering licensure) passers report: summary, per-intake trend and records. */
    public function boardExams(): Response
    {
        return Inertia::render('Admin/Reports/BoardExams', [
            'generatedAt' => now()->toIso8601String(),
            'records'     => $this->boardExams->allForReport(),
            'analytics'   => $this->analytics->boardExamAnalytics(),
        ]);
    }
}
