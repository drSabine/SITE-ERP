<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\EnrollmentCourse;
use App\Models\Student;
use App\Models\TeacherAssignment;
use App\Services\DashboardAnalyticsService;
use App\Services\GradingMonitorService;
use App\Services\StudentGradeService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardAnalyticsService $dashboardAnalyticsService,
        private StudentGradeService $studentGradeService,
        private GradingMonitorService $gradingMonitorService,
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
            $props['analytics'] = $this->dashboardAnalyticsService->adminAnalytics();
        }

        if (in_array($role, ['coordinator_it', 'coordinator_engineering'])) {
            $props['incCount'] = $activeTerm
                ? EnrollmentCourse::withInc()
                    ->whereHas('enrollment', fn($query) => $query->where('academic_term_id', $activeTerm->id))
                    ->count()
                : 0;
            $props['analytics'] = $this->dashboardAnalyticsService->coordinatorAnalytics(
                $user->coordinatorProgramCodes()
            );
        }

        // Board-exam (licensure) analytics — engineering coordinator and admin only.
        if ($role === 'admin' || $role === 'coordinator_engineering') {
            $props['boardExamAnalytics'] = $this->dashboardAnalyticsService->boardExamAnalytics();
        }

        if (($role === 'teacher' || $hasTeachingLoad) && $activeTerm) {
            $assignments = TeacherAssignment::where('teacher_id', $user->id)
                ->where('academic_term_id', $activeTerm->id)
                ->with([
                    'course:id,course_code,title',
                    'section:id,name,program_id,year_level',
                    'section.program:id,code',
                ])
                ->get();

            $metrics = $this->gradingMonitorService->metricsForAssignments($assignments->pluck('id')->all());

            $gradebooks = $assignments->map(fn ($assignment) => [
                'id'          => $assignment->id,
                'course_code' => $assignment->course?->course_code,
                'title'       => $assignment->course?->title,
                'section'     => $assignment->section?->name,
                'program'     => $assignment->section?->program?->code,
                'year_level'  => $assignment->section?->year_level,
                'metrics'     => $metrics->get($assignment->id) ?? $this->gradingMonitorService->emptyMetrics(),
            ])->values();

            $props['teaching'] = [
                'gradebooks' => $gradebooks,
                'stats'      => [
                    'sections'      => $gradebooks->count(),
                    'totalStudents' => $gradebooks->sum(fn ($book) => $book['metrics']['total_students']),
                    'ungraded'      => $gradebooks->sum(fn ($book) => $book['metrics']['pending_count']),
                    'inc'           => $gradebooks->sum(fn ($book) => $book['metrics']['inc_count']),
                ],
            ];
        }

        if ($role === 'student' && $user->student) {
            $transcript = $this->studentGradeService->transcript($user->student);
            $terms = collect($transcript['terms']);

            $props['studentSummary'] = [
                'overallGwa'  => $transcript['overallGwa'],
                'currentTerm' => $terms->firstWhere('is_active', true),
                'incTotal'    => $terms->sum('inc_count'),
                'termCount'   => $terms->count(),
            ];
        }

        return Inertia::render('Dashboard', $props);
    }
}
