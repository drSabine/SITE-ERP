<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\EnrollmentCourse;
use App\Models\TeacherAssignment;
use App\Services\GradeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradeController extends Controller
{
    public function __construct(private GradeService $gradeService) {}

    /**
     * List the teacher''s course assignments for the active academic term.
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

        $enrollmentCourses = EnrollmentCourse::whereHas(
            'enrollment',
            fn($q) => $q->where('academic_term_id', $teacherAssignment->academic_term_id)
                ->where('status', 'enrolled')
        )
        ->where('course_id', $teacherAssignment->course_id)
        ->whereIn('status', ['active', 'inc'])
        ->with([
            'enrollment' => fn($q) => $q->select('id', 'student_id')
                ->with(['student' => fn($q) => $q->select('id', 'first_name', 'last_name')]),
        ])
        ->get(['id', 'enrollment_id', 'course_id', 'final_grade', 'status']);

        return Inertia::render('Teacher/Grades/Show', [
            'assignment'        => $teacherAssignment->load(['course:id,course_code,title', 'academicTerm:id,semester']),
            'enrollmentCourses' => $enrollmentCourses,
            'validGrades'       => GradeService::VALID_GRADES,
        ]);
    }

    /**
     * Input or update the grade for a single enrollment_course.
     * Teacher submits: enrollment_course_id + grade (or null for INC).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'enrollment_course_id' => 'required|exists:enrollment_courses,id',
            'grade'                => ['nullable', 'numeric', 'in:' . implode(',', GradeService::VALID_GRADES)],
        ]);

        $ec = EnrollmentCourse::with('enrollment')->findOrFail($data['enrollment_course_id']);

        // Verify teacher is assigned to this course for this term.
        $assigned = TeacherAssignment::where('teacher_id', auth()->id())
            ->where('course_id', $ec->course_id)
            ->where('academic_term_id', $ec->enrollment->academic_term_id)
            ->exists();

        abort_if(! $assigned, 403, 'You are not assigned to this course.');

        $this->gradeService->inputGrade(
            $ec,
            isset($data['grade']) ? (float) $data['grade'] : null
        );

        return back();
    }
}
