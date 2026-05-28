<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\EnrollmentCourse;
use App\Models\TeacherAssignment;
use App\Models\TermPeriod;
use App\Services\GradeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradeController extends Controller
{
    public function __construct(private GradeService $gradeService) {}

    /**
     * List the teacher's course assignments for the active academic term.
     */
    public function index(): Response
    {
        $teacher    = auth()->user();
        $activeTerm = AcademicTerm::active()->first(['id', 'school_year_id', 'semester']);

        $assignments = $activeTerm
            ? TeacherAssignment::where('teacher_id', $teacher->id)
                ->where('academic_term_id', $activeTerm->id)
                ->with(['course:id,course_code,title,units'])
                ->get(['id', 'teacher_id', 'course_id', 'academic_term_id'])
            : collect();

        return Inertia::render('Teacher/Grades/Index', [
            'activeTerm'  => $activeTerm,
            'assignments' => $assignments,
        ]);
    }

    /**
     * Grade sheet: all students for a specific teacher assignment.
     * Shows each student's grade per term period (Prelim, Midterm, Finals).
     */
    public function show(TeacherAssignment $teacherAssignment): Response
    {
        abort_if(
            $teacherAssignment->teacher_id !== auth()->id(),
            403,
            'You are not assigned to this course.'
        );

        $termPeriods = TermPeriod::where('academic_term_id', $teacherAssignment->academic_term_id)
            ->orderByRaw("FIELD(period, 'preliminary', 'midterm', 'finals')")
            ->get(['id', 'academic_term_id', 'period', 'is_active']);

        // All enrollment_courses for this course in this term
        $enrollmentCourses = EnrollmentCourse::whereHas(
            'enrollment',
            fn($q) => $q->where('academic_term_id', $teacherAssignment->academic_term_id)
                ->where('status', 'enrolled')
        )
        ->where('course_id', $teacherAssignment->course_id)
        ->whereIn('status', ['active', 'inc'])
        ->with([
            'enrollment' => fn($q) => $q->select('id', 'student_id')
                ->with(['student:id,student_number,first_name,last_name']),
            'grades:id,enrollment_course_id,term_period_id,grade',
        ])
        ->get(['id', 'enrollment_id', 'course_id', 'final_grade', 'status']);

        return Inertia::render('Teacher/Grades/Show', [
            'assignment'        => $teacherAssignment->load(['course:id,course_code,title', 'academicTerm:id,semester']),
            'termPeriods'       => $termPeriods,
            'enrollmentCourses' => $enrollmentCourses,
        ]);
    }

    /**
     * Input or update a single grade for (enrollment_course, term_period).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'enrollment_course_id' => 'required|exists:enrollment_courses,id',
            'term_period_id'       => 'required|exists:term_periods,id',
            'grade'                => ['nullable', 'numeric', 'in:' . implode(',', GradeService::VALID_GRADES)],
        ]);

        // Verify teacher owns this course for this term
        $ec     = EnrollmentCourse::with('enrollment')->findOrFail($data['enrollment_course_id']);
        $period = TermPeriod::findOrFail($data['term_period_id']);

        $assigned = TeacherAssignment::where('teacher_id', auth()->id())
            ->where('course_id', $ec->course_id)
            ->where('academic_term_id', $ec->enrollment->academic_term_id)
            ->exists();

        abort_if(! $assigned, 403, 'You are not assigned to this course.');
        abort_if(! $period->is_active, 422, 'This grading period is not currently open.');

        $this->gradeService->inputGrade(
            $ec,
            $period,
            isset($data['grade']) ? (float) $data['grade'] : null
        );

        return back();
    }
}
