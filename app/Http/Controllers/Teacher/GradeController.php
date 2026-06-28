<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\EnrollmentCourse;
use App\Models\TeacherAssignment;
use App\Services\ActivityLogService;
use App\Services\GradeService;
use App\Services\GradingMonitorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GradeController extends Controller
{
    public function __construct(
        private GradeService $gradeService,
        private ActivityLogService $activityLogs,
        private GradingMonitorService $gradingMonitorService,
    ) {}

    /**
     * List the teacher's course assignments for the active academic term,
     * with grading progress metrics so the teacher can self-monitor.
     */
    public function index(): Response
    {
        $teacher    = auth()->user();
        $activeTerm = AcademicTerm::active()->first(['id', 'school_year_id', 'semester']);

        $assignments = TeacherAssignment::where('teacher_id', $teacher->id)
            ->when(
                $activeTerm,
                fn ($query) => $query->where('academic_term_id', $activeTerm->id),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->with([
                'course:id,course_code,title,units',
                'section:id,name,program_id,year_level',
                'section.program:id,code',
            ])
            ->paginate(10)
            ->withQueryString();

        $assignmentRows = $assignments->getCollection();
        $metricsMap = $this->gradingMonitorService->metricsForAssignments($assignmentRows->pluck('id')->all());

        $assignmentRows = $assignmentRows->map(function ($assignment) use ($metricsMap) {
            $assignment->grading_metrics = $metricsMap->get($assignment->id)
                ?? $this->gradingMonitorService->emptyMetrics();
            return $assignment;
        });

        $assignments->setCollection($assignmentRows);

        return Inertia::render('Teacher/Grades/Index', [
            'activeTerm'  => $activeTerm,
            'assignments' => $assignments,
        ]);
    }

    /**
     * Grade sheet: all enrolled students for a specific teacher assignment.
     * Each row shows the student and their current final_grade (null = not yet graded).
     */
    public function show(TeacherAssignment $teacherAssignment): Response
    {
        abort_if(
            $teacherAssignment->teacher_id !== auth()->id(),
            403,
            'You are not assigned to this course.'
        );

        abort_if(
            ! $teacherAssignment->section_id,
            422,
            'This assignment has no section.'
        );

        $enrollmentCourses = EnrollmentCourse::whereHas(
            'enrollment',
            fn($q) => $q->where('academic_term_id', $teacherAssignment->academic_term_id)
                ->where('status', 'enrolled')
                ->where('section_id', $teacherAssignment->section_id)
        )
        ->where('course_id', $teacherAssignment->course_id)
        ->whereIn('status', ['active', 'inc'])
        ->with([
            'enrollment' => fn($q) => $q->select('id', 'student_id', 'section_id')
                ->with(['student' => fn($q) => $q->select('id', 'first_name', 'last_name')]),
        ])
        ->get(['id', 'enrollment_id', 'course_id', 'final_grade', 'status'])
        ->sortBy(fn ($ec) => $ec->enrollment?->student?->last_name)
        ->values();

        return Inertia::render('Teacher/Grades/Show', [
            'assignment'        => $teacherAssignment->load(['course:id,course_code,title', 'academicTerm:id,semester,is_active', 'section:id,name,program_id,year_level', 'section.program:id,code']),
            'enrollmentCourses' => $enrollmentCourses,
            'validGrades'       => GradeService::VALID_GRADES,
        ]);
    }

    /**
     * Save many grades at once (one "Save All" submit from the gradebook).
     * Each item: { enrollment_course_id, grade?, mark_as? }.
     */
    public function bulkStore(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'grades'                          => 'required|array|min:1',
            'grades.*.enrollment_course_id'   => 'required|integer|exists:enrollment_courses,id',
            'grades.*.grade'                  => ['nullable', 'numeric', 'in:' . implode(',', GradeService::VALID_GRADES)],
            'grades.*.mark_as'                => ['nullable', 'string', 'in:inc,dropped'],
        ]);

        $teacherId = auth()->id();

        DB::transaction(function () use ($data, $teacherId) {
            foreach ($data['grades'] as $item) {
                $ec = EnrollmentCourse::with('enrollment.academicTerm')->findOrFail($item['enrollment_course_id']);

                abort_if(! $ec->enrollment?->academicTerm?->is_active, 422, 'This academic term is finalized and cannot be edited.');

                $assigned = TeacherAssignment::where('teacher_id', $teacherId)
                    ->where('course_id', $ec->course_id)
                    ->where('academic_term_id', $ec->enrollment->academic_term_id)
                    ->where('section_id', $ec->enrollment->section_id)
                    ->exists();

                abort_if(! $assigned, 403, 'You are not assigned to this course.');

                $markAs = $item['mark_as'] ?? null;
                if ($markAs === 'inc') {
                    $grade = null;
                    $status = 'inc';
                } elseif ($markAs === 'dropped') {
                    $grade = null;
                    $status = 'dropped';
                } else {
                    $grade = isset($item['grade']) ? (float) $item['grade'] : null;
                    $status = 'active';
                }

                $this->gradeService->inputGrade($ec, $grade, $status);
            }
        });

        $this->activityLogs->record(
            $request,
            'submitted_grades',
            'Grades',
            'Saved ' . count($data['grades']) . ' student grade(s) in bulk.',
            null,
            ['count' => count($data['grades'])]
        );

        return back()->with('success', count($data['grades']) . ' grade(s) saved.');
    }

    /**
     * Input or update the grade for a single enrollment_course.
     * Teacher submits: enrollment_course_id + grade (numeric) OR mark_as (inc|dropped).
     * mark_as takes priority — when set, grade is ignored and status is applied immediately.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'enrollment_course_id' => 'required|exists:enrollment_courses,id',
            'grade'                => ['nullable', 'numeric', 'in:' . implode(',', GradeService::VALID_GRADES)],
            'mark_as'              => ['nullable', 'string', 'in:inc,dropped'],
        ]);

        $ec = EnrollmentCourse::with('enrollment.academicTerm')->findOrFail($data['enrollment_course_id']);

        abort_if(! $ec->enrollment?->academicTerm?->is_active, 422, 'This academic term is finalized and cannot be edited.');

        // Verify teacher is assigned to this course for this term.
        $assigned = TeacherAssignment::where('teacher_id', auth()->id())
            ->where('course_id', $ec->course_id)
            ->where('academic_term_id', $ec->enrollment->academic_term_id)
            ->where('section_id', $ec->enrollment->section_id)
            ->exists();

        abort_if(! $assigned, 403, 'You are not assigned to this course.');

        $markAs = $data['mark_as'] ?? null;

        if ($markAs === 'inc') {
            $grade  = null;
            $status = 'inc';
        } elseif ($markAs === 'dropped') {
            $grade  = null;
            $status = 'dropped';
        } else {
            $grade  = isset($data['grade']) ? (float) $data['grade'] : null;
            $status = 'active';
        }

        $this->gradeService->inputGrade($ec, $grade, $status);

        $this->activityLogs->record(
            $request,
            'submitted_grade',
            'Grades',
            'Submitted or updated a student grade.',
            $ec,
            ['grade' => $data['grade'] ?? null, 'mark_as' => $markAs]
        );

        return back();
    }
}
