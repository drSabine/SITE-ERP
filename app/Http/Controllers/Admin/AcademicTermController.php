<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\SchoolYear;
use App\Services\ActivityLogService;
use App\Services\GradeService;
use App\Services\SchoolYearService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicTermController extends Controller
{
    public function __construct(
        private SchoolYearService $service,
        private GradeService $gradeService,
        private ActivityLogService $activityLogs,
    ) {}

    // Returns terms for a given school year — used by the SchoolYears page via axios
    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate(['school_year_id' => 'required|exists:school_years,id']);

        $terms = AcademicTerm::where('school_year_id', $request->school_year_id)
            ->orderByRaw("FIELD(semester, 'first', 'second', 'summer')")
            ->get(['id', 'school_year_id', 'semester', 'is_active', 'start_date', 'end_date']);

        return response()->json($terms);
    }

    public function store(Request $request, SchoolYear $schoolYear): RedirectResponse
    {
        $request->validate([
            'semester' => 'required|in:first,second,summer',
        ]);

        if ($request->semester === 'summer') {
            $academicTerm = $this->service->createSummerTerm($schoolYear);

            $this->activityLogs->record(
                $request,
                'created',
                'Academic Terms',
                "Created summer term for {$schoolYear->name}.",
                $academicTerm
            );
        }

        return back();
    }

    public function update(Request $request, AcademicTerm $academicTerm): RedirectResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after:start_date',
        ]);

        $academicTerm->update($data);

        $this->activityLogs->record(
            $request,
            'updated',
            'Academic Terms',
            "Updated {$academicTerm->semester} term dates.",
            $academicTerm
        );

        return back();
    }

    public function activate(Request $request, AcademicTerm $academicTerm): RedirectResponse
    {
        $this->service->activateTerm($academicTerm);

        $this->activityLogs->record(
            $request,
            'activated',
            'Academic Terms',
            "Activated {$academicTerm->semester} term.",
            $academicTerm
        );

        return back();
    }

    /**
     * Finalize an academic term — locks all active enrollment_course statuses
     * to passed / failed / inc and marks the term as inactive.
     */
    public function finalize(Request $request, AcademicTerm $academicTerm): RedirectResponse
    {
        $this->gradeService->finalizeTerm($academicTerm);

        $this->activityLogs->record(
            $request,
            'finalized',
            'Academic Terms',
            "Finalized {$academicTerm->semester} term and locked grade outcomes.",
            $academicTerm
        );

        return back();
    }
}
