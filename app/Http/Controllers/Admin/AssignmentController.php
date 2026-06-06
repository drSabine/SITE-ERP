<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\Course;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\TeacherAssignment;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\SectionAssignmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    public function __construct(
        private SectionAssignmentService $service,
        private ActivityLogService $activityLogs,
    ) {}

    public function index(Request $request): Response
    {
        $activeTerm = AcademicTerm::active()->first(['id', 'school_year_id']);
        $schoolYearId = $request->filled('school_year_id')
            ? (int) $request->school_year_id
            : $activeTerm?->school_year_id;

        $schoolYear = SchoolYear::with([
            'academicTerms' => fn ($query) => $query
                ->orderByRaw("FIELD(semester, 'first', 'second', 'summer')")
                ->select('id', 'school_year_id', 'semester', 'is_active'),
        ])->findOrFail($schoolYearId, ['id', 'name']);

        $termId = $request->filled('academic_term_id')
            ? (int) $request->academic_term_id
            : ($schoolYear->academicTerms->firstWhere('id', $activeTerm?->id)?->id ?? $schoolYear->academicTerms->first()?->id);

        abort_if(! $termId, 404, 'No active academic term found.');

        $term = AcademicTerm::with(['schoolYear:id,name'])
            ->where('school_year_id', $schoolYear->id)
            ->findOrFail($termId, ['id', 'school_year_id', 'semester']);

        return Inertia::render('Admin/Assignments/Index', [
            'term' => $term,
            'selectedSchoolYear' => $schoolYear,
            'assignments' => TeacherAssignment::where('academic_term_id', $term->id)
                ->with([
                    'teacher' => fn ($query) => $query->select('id', 'name')->with(['userProfile:user_id,first_name,last_name']),
                    'course:id,course_code,title,units',
                    'section:id,program_id,year_level,name',
                    'section.program:id,code,name',
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
            'schoolYears' => SchoolYear::with([
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

        $term = AcademicTerm::findOrFail($data['academic_term_id'], ['id', 'semester']);
        $course = Course::findOrFail($data['course_id'], ['id', 'semester_type']);
        abort_if($course->semester_type !== $term->semester, 422, 'Selected subject does not belong to this academic term.');

        $exists = TeacherAssignment::where('course_id', $data['course_id'])
            ->where('section_id', $data['section_id'])
            ->where('academic_term_id', $data['academic_term_id'])
            ->exists();

        abort_if($exists, 422, 'This section already has a teacher assigned for this subject in this term.');

        $teacherAssignment = TeacherAssignment::create($data);

        $this->activityLogs->record(
            $request,
            'created',
            'Teacher Assignments',
            "Assigned {$teacher->name} to a section subject.",
            $teacherAssignment,
            [
                'teacher_id' => $data['teacher_id'],
                'course_id' => $data['course_id'],
                'section_id' => $data['section_id'],
                'academic_term_id' => $data['academic_term_id'],
            ]
        );

        return back();
    }

    public function destroy(Request $request, TeacherAssignment $teacherAssignment): RedirectResponse
    {
        $teacherAssignment->delete();

        $this->activityLogs->record(
            $request,
            'deleted',
            'Teacher Assignments',
            'Removed a teacher assignment.',
            $teacherAssignment
        );

        return back();
    }

}
