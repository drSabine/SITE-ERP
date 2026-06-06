<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\EnrollmentCourse;
use App\Models\Program;
use App\Models\Section;
use App\Models\TeacherAssignment;
use App\Models\User;
use App\Services\GradingMonitorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradingMonitorController extends Controller
{
    public function __construct(private GradingMonitorService $service) {}

    public function index(Request $request): Response
    {
        $scopedCodes = auth()->user()->coordinatorProgramCodes();
        $scopedProgramIds = $scopedCodes !== null
            ? Program::whereIn('code', $scopedCodes)->pluck('id')->all()
            : null;

        $activeTermId = AcademicTerm::active()->value('id');
        $termId = $request->filled('term_id') ? (int) $request->term_id : $activeTermId;

        $filters = [
            'term_id' => $termId,
            'program_id' => $request->input('program_id', ''),
            'year_level' => $request->input('year_level', ''),
            'teacher_id' => $request->input('teacher_id', ''),
            'section_id' => $request->input('section_id', ''),
        ];

        $programs = Program::active()
            ->when($scopedCodes !== null, fn ($query) => $query->whereIn('code', $scopedCodes))
            ->get(['id', 'code', 'name']);

        return Inertia::render('Coordinator/GradingMonitor/Index', [
            'assignments' => $this->service->getPaginatedAssignments($filters, $scopedProgramIds),
            'filters' => $filters,
            'schoolYears' => \App\Models\SchoolYear::with([
                'academicTerms' => fn ($query) => $query
                    ->orderByRaw("FIELD(semester, 'first', 'second', 'summer')")
                    ->select('id', 'school_year_id', 'semester', 'is_active'),
            ])->ordered()->get(['id', 'name']),
            'programs' => $programs,
            'teachers' => User::teachers()->active()
                ->with(['userProfile:user_id,first_name,last_name'])
                ->get(['id', 'name']),
            'sections' => Section::active()
                ->with(['program:id,code'])
                ->when($scopedProgramIds !== null, fn ($query) => $query->whereIn('program_id', $scopedProgramIds))
                ->orderBy('year_level')
                ->orderBy('name')
                ->get(['id', 'program_id', 'year_level', 'name']),
        ]);
    }

    public function students(TeacherAssignment $teacherAssignment): JsonResponse
    {
        $scopedCodes = auth()->user()->coordinatorProgramCodes();
        if ($scopedCodes !== null) {
            $allowedProgramIds = Program::whereIn('code', $scopedCodes)->pluck('id')->all();
            abort_unless(in_array((int) $teacherAssignment->section?->program_id, $allowedProgramIds, true), 403);
        }

        $students = EnrollmentCourse::where('course_id', $teacherAssignment->course_id)
            ->whereHas('enrollment', fn ($query) => $query
                ->where('academic_term_id', $teacherAssignment->academic_term_id)
                ->where('section_id', $teacherAssignment->section_id)
                ->where('status', 'enrolled'))
            ->whereIn('status', ['active', 'inc', 'passed', 'failed', 'dropped'])
            ->with([
                'enrollment' => fn ($query) => $query->select('id', 'student_id')
                    ->with(['student' => fn ($studentQuery) => $studentQuery->select('id', 'first_name', 'last_name')]),
            ])
            ->orderBy('id')
            ->get(['id', 'enrollment_id', 'final_grade', 'status']);

        return response()->json(['students' => $students]);
    }
}
