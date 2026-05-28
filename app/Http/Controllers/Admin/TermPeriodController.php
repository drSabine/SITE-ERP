<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TermPeriod;
use App\Services\SchoolYearService;
use App\Services\GradeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TermPeriodController extends Controller
{
    public function __construct(
        private SchoolYearService $schoolYearService,
        private GradeService $gradeService
    ) {}

    public function update(Request $request, TermPeriod $termPeriod): RedirectResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after:start_date',
        ]);

        $termPeriod->update($data);

        return back();
    }

    public function activate(TermPeriod $termPeriod): RedirectResponse
    {
        $this->schoolYearService->activatePeriod($termPeriod);
        return back();
    }

    public function deactivate(TermPeriod $termPeriod): RedirectResponse
    {
        $this->schoolYearService->deactivatePeriod($termPeriod);
        return back();
    }

    /**
     * Close the Finals period and compute final grades for the whole term.
     */
    public function finalizeTerm(TermPeriod $termPeriod): RedirectResponse
    {
        abort_if($termPeriod->period !== 'finals', 422, 'Only the Finals period can trigger term finalization.');

        $this->gradeService->finalizeTerm($termPeriod->academicTerm);
        $this->schoolYearService->deactivatePeriod($termPeriod);

        return back();
    }
}
