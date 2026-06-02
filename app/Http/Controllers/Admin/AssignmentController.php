<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\Course;
use App\Models\Section;
use App\Models\TeacherAssignment;
use App\Models\User;
use App\Services\SectionAssignmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    public function __construct(private SectionAssignmentService $service) {}

    public function index(Request $request): Response
    {
        $termId = $request->filled('academic_term_id')
            ? (int) $request->academic_term_id
            : AcademicTerm::active()->value('id');
        abort_if(! $termId, 404, 'No active academic term found.');

        $term = AcademicTerm::with(['schoolYear:id,name'])
            ->findOrFail($termId, ['id', 'school_year_id', 'semester']);

        return Inertia::render('Admin/Assignments/Index', [
            'term' => $term,
            'assignments' => TeacherAssignment::where('academic_term_id', $term->id)
                ->with([
                    'teacher' => fn ($query) => $query->select('id', 'name')->with(['userProfile:user_id,first_name,last_name']),
                    'course:id,course_code,title,units',
                    'section:id,program_id,year_level,name',
                    'section.program:id,code,name',
                    'finalizer:id,name',
                ])
                ->paginate(10)
                ->withQueryString(),
            'teachers' => User::teachers()->active()
                ->with(['userProfile:user_id,first_name,last_name'])
                ->get(['id', 'name']),
            'courses' => Course::active()->get(['id', 'program_id', 'course_code', 'title', 'units', 'year_level', 'semester_type']),
            'sections' => Section::active()
                ->with(['program:id,code,name'])
                ->orderBy('year_level')
                ->orderBy('name')
                ->get(['id', 'program_id', 'year_level', 'name']),
            'schoolYears' => \App\Models\SchoolYear::with([
                'academicTerms' => fn ($query) => $query
                    ->orderByRaw("FIELD(semester, 'first', 'second', 'summer')")
                    ->select('id', 'school_year_id', 'semester', 'is_active'),
            ])->ordered()->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'course_id' => 'required|exists:courses,id',
            'academic_term_id' => 'required|exists:academic_terms,id',
            'section_id' => 'required|exists:sections,id',
        ]);

        $teacher = User::findOrFail($data['teacher_id']);
        abort_if($teacher->role !== 'teacher', 422, 'Selected user is not a teacher.');

        $section = Section::with(['program:id,code'])->findOrFail($data['section_id']);
        $this->service->validateCourseFitsSection($section, (int) $data['course_id']);

        $exists = TeacherAssignment::where('course_id', $data['course_id'])
            ->where('section_id', $data['section_id'])
            ->where('academic_term_id', $data['academic_term_id'])
            ->exists();

        abort_if($exists, 422, 'This section already has a teacher assigned for this subject in this term.');

        TeacherAssignment::create($data);

        return back();
    }

    public function destroy(TeacherAssignment $teacherAssignment): RedirectResponse
    {
        $teacherAssignment->delete();
        return back();
    }

    public function finalize(TeacherAssignment $teacherAssignment): RedirectResponse
    {
        $teacherAssignment->update([
            'finalized_at' => now(),
            'finalized_by' => auth()->id(),
        ]);

        return back();
    }

    public function reopen(TeacherAssignment $teacherAssignment): RedirectResponse
    {
        $teacherAssignment->update([
            'finalized_at' => null,
            'finalized_by' => null,
        ]);

        return back();
    }
}
