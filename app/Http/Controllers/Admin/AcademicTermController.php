<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\SchoolYear;
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
    ) {}

    // Returns terms for a given school year — used by the SchoolYears page via axios
    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate(['school_year_id' => 'required|exists:school_years,id']);

        $terms = AcademicTerm::where('school_year_id', $request->school_year_id)
            ->get(['id', 'school_year_id', 'semester', 'is_active', 'start_date', 'end_date']);

        return response()->json($terms);
    }

    public function store(Request $request, SchoolYear $schoolYear): RedirectResponse
    {
        $request->validate([
            'semester' => 'required|in:first,second,summer',
        ]);

        if ($request->semester === 'summer') {
            $this->service->createSummerTerm($schoolYear);
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

        return back();
    }

    public function activate(AcademicTerm $academicTerm): RedirectResponse
    {
        $this->service->activateTerm($academicTerm);
        return back();
    }

    /**
     * Finalize an academic term — locks all active enrollment_course statuses
     * to passed / failed / inc and marks the term as inactive.
     */
    public function finalize(AcademicTerm $academicTerm): RedirectResponse
    {
        $this->gradeService->finalizeTerm($academicTerm);
        return back();
    }
}
