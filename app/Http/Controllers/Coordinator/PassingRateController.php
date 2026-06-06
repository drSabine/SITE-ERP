<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\PassingRate;
use App\Models\Program;
use App\Services\ActivityLogService;
use App\Services\PassingRateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PassingRateController extends Controller
{
    public function __construct(
        private PassingRateService $passingRates,
        private ActivityLogService $activityLogs,
    ) {}

    public function index(Request $request): Response
    {
        $records = PassingRate::with('program:id,code,name')
            ->select(['id', 'program_id', 'exam_month', 'exam_year', 'total_takers', 'passers_count', 'notes', 'recorded_by', 'created_at'])
            ->orderByDesc('exam_year')
            ->orderByDesc('exam_month')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Coordinator/PassingRates/Index', [
            'records'   => $records,
            'programs'  => Program::active()->withBoardExam()->get(['id', 'code', 'name']),
            'analytics' => $this->passingRates->getAnalytics(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'program_id'    => 'required|exists:programs,id',
            'exam_month'    => 'required|integer|between:1,12',
            'exam_year'     => 'required|integer|min:2000|max:2099',
            'total_takers'  => 'required|integer|min:1',
            'passers_count' => 'required|integer|min:0|lte:total_takers',
            'notes'         => 'nullable|string|max:1000',
        ]);

        $data['recorded_by'] = $request->user()->id;

        $record = PassingRate::create($data);

        $this->activityLogs->record(
            $request,
            'created',
            'Passing Rates',
            "Logged passing rate for {$record->program->code}.",
            $record
        );

        return back();
    }

    public function update(Request $request, PassingRate $passingRate): RedirectResponse
    {
        $data = $request->validate([
            'program_id'    => 'required|exists:programs,id',
            'exam_month'    => 'required|integer|between:1,12',
            'exam_year'     => 'required|integer|min:2000|max:2099',
            'total_takers'  => 'required|integer|min:1',
            'passers_count' => 'required|integer|min:0|lte:total_takers',
            'notes'         => 'nullable|string|max:1000',
        ]);

        $passingRate->update($data);

        $this->activityLogs->record(
            $request,
            'updated',
            'Passing Rates',
            "Updated passing rate record for {$passingRate->program->code}.",
            $passingRate
        );

        return back();
    }

    public function destroy(Request $request, PassingRate $passingRate): RedirectResponse
    {
        $programCode = $passingRate->program->code;

        $passingRate->delete();

        $this->activityLogs->record(
            $request,
            'deleted',
            'Passing Rates',
            "Deleted passing rate record for {$programCode}.",
            $passingRate
        );

        return back();
    }
}
