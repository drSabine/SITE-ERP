<?php

namespace App\Http\Controllers;

use App\Models\BoardExamResult;
use App\Services\ActivityLogService;
use App\Services\BoardExamService;
use App\Services\DashboardAnalyticsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BoardExamController extends Controller
{
    public function __construct(
        private BoardExamService $service,
        private DashboardAnalyticsService $analytics,
        private ActivityLogService $activityLogs,
    ) {}

    public function index(): Response
    {
        return Inertia::render('BoardExam/Index', [
            'results'   => $this->service->paginate(),
            'programs'  => $this->service->engineeringPrograms(),
            'months'    => BoardExamService::MONTHS,
            'analytics' => $this->analytics->boardExamAnalytics(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);

        $result = $this->service->create($data, $request->user()->id);

        $this->activityLogs->record(
            $request,
            'created',
            'Board Exams',
            "Recorded {$result->exam_name} ({$result->exam_year}) board-exam passers.",
            $result,
        );

        return back()->with('success', 'Board exam record saved.');
    }

    public function update(Request $request, BoardExamResult $boardExamResult): RedirectResponse
    {
        $data = $this->validatedData($request);

        $this->service->update($boardExamResult, $data);

        $this->activityLogs->record(
            $request,
            'updated',
            'Board Exams',
            "Updated {$boardExamResult->exam_name} ({$boardExamResult->exam_year}) board-exam record.",
            $boardExamResult,
        );

        return back()->with('success', 'Board exam record updated.');
    }

    public function destroy(Request $request, BoardExamResult $boardExamResult): RedirectResponse
    {
        $label = "{$boardExamResult->exam_name} ({$boardExamResult->exam_year})";
        $boardExamResult->delete();

        $this->activityLogs->record(
            $request,
            'deleted',
            'Board Exams',
            "Deleted {$label} board-exam record.",
            $boardExamResult,
        );

        return back()->with('success', 'Board exam record deleted.');
    }

    /**
     * Validate input and enforce domain rules: program must be an engineering
     * program, passers cannot exceed takers, and at least one taker is required.
     */
    private function validatedData(Request $request): array
    {
        $data = $request->validate([
            'program_id'          => ['required', 'integer', Rule::in($this->service->engineeringProgramIds())],
            'exam_name'           => 'required|string|max:191',
            'exam_year'           => 'required|integer|min:2000|max:2100',
            'exam_month'          => 'required|integer|min:1|max:12',
            'first_takers'        => 'required|integer|min:0|max:100000',
            'first_taker_passers' => 'required|integer|min:0|lte:first_takers',
            'retakers'            => 'required|integer|min:0|max:100000',
            'retaker_passers'     => 'required|integer|min:0|lte:retakers',
            'remarks'             => 'nullable|string|max:1000',
        ]);

        if ($data['first_takers'] + $data['retakers'] < 1) {
            throw ValidationException::withMessages([
                'first_takers' => 'Record at least one first-taker or retaker.',
            ]);
        }

        return $data;
    }
}
