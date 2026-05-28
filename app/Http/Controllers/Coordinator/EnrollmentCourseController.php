<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\EnrollmentCourse;
use App\Services\EnrollmentService;
use App\Services\GradeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EnrollmentCourseController extends Controller
{
    public function __construct(
        private EnrollmentService $enrollmentService,
        private GradeService $gradeService
    ) {}

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'enrollment_id' => 'required|exists:enrollments,id',
            'course_id'     => 'required|exists:courses,id',
        ]);

        $enrollment = Enrollment::findOrFail($data['enrollment_id']);
        $course     = Course::findOrFail($data['course_id']);

        $this->enrollmentService->addCourse($enrollment, $course);

        return back();
    }

    public function destroy(EnrollmentCourse $enrollmentCourse): RedirectResponse
    {
        $this->enrollmentService->removeCourse($enrollmentCourse);
        return back();
    }

    /**
     * Override final_grade manually (INC resolution).
     */
    public function overrideGrade(Request $request, EnrollmentCourse $enrollmentCourse): RedirectResponse
    {
        $data = $request->validate([
            'final_grade' => 'required|numeric|in:' . implode(',', GradeService::VALID_GRADES),
        ]);

        $this->gradeService->overrideFinalGrade($enrollmentCourse, (float) $data['final_grade']);

        return back();
    }
}
