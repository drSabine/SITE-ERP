<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgramController extends Controller
{
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

        Program::create($data);

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

        return back();
    }

    public function destroy(Program $program): RedirectResponse
    {
        if ($program->courses()->exists()) {
            return back()->with('error', 'Cannot delete program with courses.');
        }

        $program->delete();

        return back()->with('success', 'Program deleted successfully.');
    }
}
