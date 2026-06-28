<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Section;
use App\Services\ActivityLogService;
use App\Services\SectionAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
    public function __construct(
        private SectionAssignmentService $service,
        private ActivityLogService $activityLogs,
    ) {}

    public function index(Request $request): Response
    {
        $termId = $request->filled('academic_term_id')
            ? (int) $request->academic_term_id
            : AcademicTerm::active()->value('id');
        abort_if(! $termId, 404, 'No active academic term found.');

        $term = AcademicTerm::with(['schoolYear:id,name'])
            ->findOrFail($termId, ['id', 'school_year_id', 'semester']);

        $scopedCodes = auth()->user()->coordinatorProgramCodes();
        $scopedProgramIds = $scopedCodes !== null
            ? Program::whereIn('code', $scopedCodes)->pluck('id')
            : null;

        $sectionsQuery = Section::active()
            ->with(['program:id,code,name'])
            ->withCount(['enrollments as students_count' => fn ($query) => $query
                ->where('academic_term_id', $term->id)
                ->where('status', 'enrolled')])
            ->orderBy('year_level')
            ->orderBy('name');

        if ($scopedProgramIds !== null) {
            $sectionsQuery->whereIn('program_id', $scopedProgramIds);
        }

        $programs = $scopedCodes !== null
            ? Program::active()->whereIn('code', $scopedCodes)->get(['id', 'code', 'name'])
            : Program::active()->get(['id', 'code', 'name']);

        return Inertia::render('Coordinator/Sections/Index', [
            'term'     => $term,
            'sections' => $sectionsQuery->get(['id', 'program_id', 'year_level', 'name', 'is_active']),
            'programs' => $programs,
        ]);
    }

    /**
     * Per-section roster page — view, add, and remove students after the section exists.
     */
    public function manage(Section $section): Response
    {
        $section->load('program:id,code,name');

        $termId = AcademicTerm::active()->value('id');
        abort_if(! $termId, 404, 'No active academic term found.');
        $term = AcademicTerm::with(['schoolYear:id,name'])
            ->findOrFail($termId, ['id', 'school_year_id', 'semester']);

        $scopedCodes = auth()->user()->coordinatorProgramCodes();
        if ($scopedCodes !== null) {
            abort_unless(in_array($section->program->code, $scopedCodes, true), 403);
        }

        $studentSelect = fn ($query) => $query->select('id', 'first_name', 'middle_name', 'last_name', 'suffix');

        $roster = Enrollment::with(['student' => $studentSelect])
            ->where('section_id', $section->id)
            ->where('academic_term_id', $term->id)
            ->where('status', 'enrolled')
            ->orderByRaw('(SELECT last_name FROM students WHERE students.id = enrollments.student_id) ASC')
            ->get(['id', 'student_id', 'year_level', 'status', 'section_id']);

        $assignable = Enrollment::with(['student' => $studentSelect])
            ->where('academic_term_id', $term->id)
            ->where('program_id', $section->program_id)
            ->where('year_level', $section->year_level)
            ->where('status', 'enrolled')
            ->whereNull('section_id')
            ->orderByRaw('(SELECT last_name FROM students WHERE students.id = enrollments.student_id) ASC')
            ->get(['id', 'student_id', 'year_level']);

        return Inertia::render('Coordinator/Sections/Manage', [
            'section'    => $section,
            'term'       => $term,
            'roster'     => $roster,
            'assignable' => $assignable,
        ]);
    }

    public function unassignStudent(Request $request, Section $section): RedirectResponse
    {
        $data = $request->validate([
            'enrollment_id' => 'required|integer|exists:enrollments,id',
        ]);

        $this->service->unassignStudentFromSection($section, (int) $data['enrollment_id']);

        $this->activityLogs->record(
            $request,
            'unassigned',
            'Sections',
            "Removed a student from section {$section->name}.",
            $section,
            ['enrollment_id' => $data['enrollment_id']]
        );

        return back();
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|integer|min:1|max:5',
            'name' => 'required|string|max:100',
        ]);

        $program = Program::findOrFail($data['program_id']);
        $this->service->validateYearLevelByProgram($program->code, (int) $data['year_level']);

        $section = Section::firstOrCreate(
            [
                'program_id' => $data['program_id'],
                'year_level' => $data['year_level'],
                'name' => trim($data['name']),
            ],
            ['is_active' => true]
        );

        $this->activityLogs->record(
            $request,
            'created',
            'Sections',
            "Created or restored section {$section->name}.",
            $section
        );

        return back();
    }

    public function bulkAssignStudents(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'academic_term_id' => 'required|exists:academic_terms,id',
            'section_id' => 'required|exists:sections,id',
            'enrollment_ids' => 'required|array|min:1',
            'enrollment_ids.*' => 'integer|exists:enrollments,id',
        ]);

        $section = Section::with(['program:id,code'])->findOrFail($data['section_id']);
        $count = $this->service->bulkAssignStudentsToSection(
            $section,
            (int) $data['academic_term_id'],
            $data['enrollment_ids']
        );

        $this->activityLogs->record(
            $request,
            'assigned',
            'Sections',
            "Assigned {$count} student(s) to section {$section->name}.",
            $section,
            ['student_count' => $count, 'academic_term_id' => $data['academic_term_id']]
        );

        return back()->with('success', "{$count} student(s) assigned to {$section->name}.");
    }

    public function studentsPreview(Request $request): JsonResponse
    {
        $data = $request->validate([
            'academic_term_id' => 'required|exists:academic_terms,id',
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|integer|min:1|max:5',
        ]);

        $scopedCodes = auth()->user()->coordinatorProgramCodes();
        $program = Program::findOrFail($data['program_id'], ['id', 'code']);
        $this->service->validateYearLevelByProgram($program->code, (int) $data['year_level']);

        if ($scopedCodes !== null) {
            $allowedProgramIds = Program::whereIn('code', $scopedCodes)->pluck('id')->all();
            abort_unless(in_array((int) $data['program_id'], $allowedProgramIds, true), 403);
        }

        $enrollments = Enrollment::with([
            'student' => fn ($query) => $query
                ->select('id', 'first_name', 'middle_name', 'last_name', 'suffix'),
        ])
            ->where('academic_term_id', $data['academic_term_id'])
            ->where('program_id', $data['program_id'])
            ->where('year_level', $data['year_level'])
            ->where('status', 'enrolled')
            ->whereNull('section_id')
            ->orderByRaw('(SELECT last_name FROM students WHERE students.id = enrollments.student_id) ASC')
            ->get(['id', 'student_id']);

        return response()->json([
            'enrollments' => $enrollments,
        ]);
    }
}
