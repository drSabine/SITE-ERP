<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolYear;
use App\Services\SchoolYearService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolYearController extends Controller
{
    public function __construct(private SchoolYearService $service) {}

    public function index(): Response
    {
        return Inertia::render('Admin/SchoolYears/Index', [
            'schoolYears' => SchoolYear::ordered()
                ->withCount('academicTerms')
                ->get(['id', 'name', 'start_date', 'end_date', 'is_active', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'              => 'required|string|max:20|unique:school_years,name',
            'start_date'        => 'required|date',
            'end_date'          => 'required|date|after:start_date',
            'summer_start_date' => 'nullable|date',
            'summer_end_date'   => 'nullable|date|after:summer_start_date',
        ]);

        $this->service->create($data);

        return back();
    }

    public function update(Request $request, SchoolYear $schoolYear): RedirectResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:20|unique:school_years,name,' . $schoolYear->id,
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after:start_date',
        ]);

        $schoolYear->update($data);

        return back();
    }

    public function activate(SchoolYear $schoolYear): RedirectResponse
    {
        $this->service->activate($schoolYear);
        return back();
    }

    public function finalize(SchoolYear $schoolYear): RedirectResponse
    {
        $this->service->finalize($schoolYear);
        return back();
    }

    public function destroy(SchoolYear $schoolYear): RedirectResponse
    {
        if ($schoolYear->is_active) {
            return back()->with('error', 'Cannot delete active school year.');
        }

        if ($schoolYear->status === 'finalized') {
            return back()->with('error', 'Cannot delete finalized school year.');
        }

        if ($schoolYear->academicTerms()->exists()) {
            return back()->with('error', 'Cannot delete school year with academic terms.');
        }

        $schoolYear->delete();

        return back()->with('success', 'School year deleted successfully.');
    }
}
