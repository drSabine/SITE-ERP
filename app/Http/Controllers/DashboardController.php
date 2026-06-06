<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\EnrollmentCourse;
use App\Models\Student;
use App\Services\DashboardAnalyticsService;
use App\Services\PassingRateService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardAnalyticsService $dashboardAnalyticsService,
        private PassingRateService $passingRateService,
    ) {}

    public function index(): Response
    {
        $user = auth()->user();
        $role = $user->role;

        $activeTerm = AcademicTerm::active()
            ->with(['schoolYear:id,name'])
            ->first(['id', 'school_year_id', 'semester', 'is_active']);

        // Admin, coordinators, and teachers can all carry a teaching load for the active term.
        // The frontend shows the Teaching section only when this is true (or role === teacher).
        $hasTeachingLoad = in_array($role, ['admin', 'coordinator_it', 'coordinator_engineering', 'teacher']) && $activeTerm
            ? $user->teacherAssignments()->where('academic_term_id', $activeTerm->id)->exists()
            : false;

        $props = [
            'activeTerm'      => $activeTerm,
            'hasTeachingLoad' => $hasTeachingLoad,
        ];

        if ($role === 'admin') {
            $props['studentCount']  = Student::active()->count();
            $props['enrolledCount'] = $activeTerm
                ? $activeTerm->enrollments()->where('status', 'enrolled')->count()
                : 0;
            $props['analytics']          = $this->dashboardAnalyticsService->adminAnalytics();
            $props['passingRatePreview'] = $this->passingRateService->getDashboardPreview();
        }

        if (in_array($role, ['coordinator_it', 'coordinator_engineering'])) {
            $props['incCount'] = $activeTerm
                ? EnrollmentCourse::withInc()
                    ->whereHas('enrollment', fn($query) => $query->where('academic_term_id', $activeTerm->id))
                    ->count()
                : 0;
            $props['passingRatePreview'] = $this->passingRateService->getDashboardPreview();
        }

        return Inertia::render('Dashboard', $props);
    }
}
