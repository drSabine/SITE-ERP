<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgramController extends Controller
{
    public function __construct(private ActivityLogService $activityLogs) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Programs/Index', [
            'programs' => Program::withCount('courses')->get(['id', 'code', 'name', 'is_active']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code'        => 'required|string|max:20|unique:programs,code',
            'name'        => 'required|string|max:191',
            'description' => 'nullable|string',
        ]);

        $program = Program::create($data);

        $this->activityLogs->record(
            $request,
            'created',
            'Programs',
            "Created program {$program->code}.",
            $program
        );

        return back();
    }

    public function update(Request $request, Program $program): RedirectResponse
    {
        $data = $request->validate([
            'code'        => 'required|string|max:20|unique:programs,code,' . $program->id,
            'name'        => 'required|string|max:191',
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
        ]);

        $program->update($data);

        $this->activityLogs->record(
            $request,
            'updated',
            'Programs',
            "Updated program {$program->code}.",
            $program
        );

        return back();
    }

    public function destroy(Request $request, Program $program): RedirectResponse
    {
        if ($program->courses()->exists()) {
            return back()->with('error', 'Cannot delete program with courses.');
        }

        $program->delete();

        $this->activityLogs->record(
            $request,
            'deleted',
            'Programs',
            "Deleted program {$program->code}.",
            $program
        );

        return back()->with('success', 'Program deleted successfully.');
    }
}
