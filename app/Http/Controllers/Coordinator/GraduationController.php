<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Services\ActivityLogService;
use App\Services\GraduationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GraduationController extends Controller
{
    public function __construct(
        private GraduationService $service,
        private ActivityLogService $activityLogs,
    ) {}

    private function scopedProgramIds(): ?array
    {
        $codes = auth()->user()->coordinatorProgramCodes();
        return $codes !== null ? Program::whereIn('code', $codes)->pluck('id')->all() : null;
    }

    public function index(): Response
    {
        $programIds = $this->scopedProgramIds();
        $activeSchoolYear = SchoolYear::active()->first(['id', 'name']);

        $graduatedThisYear = $activeSchoolYear
            ? Student::where('status', 'graduated')
                ->where('graduated_school_year_id', $activeSchoolYear->id)
                ->when($programIds !== null, fn ($query) => $query->whereIn('program_id', $programIds))
                ->count()
            : 0;

        return Inertia::render('Coordinator/Graduation/Index', [
            'candidates'        => $this->service->candidates($programIds),
            'activeSchoolYear'  => $activeSchoolYear,
            'graduatedThisYear' => $graduatedThisYear,
        ]);
    }

    public function graduate(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_ids'   => 'required|array|min:1',
            'student_ids.*' => 'integer|exists:students,id',
        ]);

        $allowedProgramIds = $this->scopedProgramIds();
        $count = 0;

        foreach (Student::whereIn('id', $data['student_ids'])->get() as $student) {
            if ($allowedProgramIds !== null && ! in_array($student->program_id, $allowedProgramIds, true)) {
                continue;
            }
            if (! $this->service->isEligible($student)) {
                continue; // re-validate server-side; skip anyone no longer eligible
            }

            $this->service->graduate($student);
            $count++;
        }

        $this->activityLogs->record(
            $request,
            'graduated',
            'Graduation',
            "Graduated {$count} student(s).",
            null,
            ['count' => $count]
        );

        return back()->with('success', "{$count} student(s) graduated.");
    }
}
