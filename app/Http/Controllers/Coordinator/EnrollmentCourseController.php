<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\EnrollmentCourse;
use App\Services\ActivityLogService;
use App\Services\EnrollmentService;
use App\Services\GradeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EnrollmentCourseController extends Controller
{
    public function __construct(
        private EnrollmentService $enrollmentService,
        private GradeService $gradeService,
        private ActivityLogService $activityLogs,
    ) {}

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'enrollment_id' => 'required|exists:enrollments,id',
            'course_id'     => 'required|exists:courses,id',
            'force'         => 'sometimes|boolean',
        ]);

        $enrollment = Enrollment::findOrFail($data['enrollment_id']);
        $course     = Course::findOrFail($data['course_id']);

        if (! $request->boolean('force')) {
            $unmet = $this->enrollmentService->getUnmetPrerequisites($enrollment, $course);

            if (! empty($unmet)) {
                return back()->withErrors([
                    'prereq_warning' => implode('; ', $unmet),
                ]);
            }
        }

        $enrollmentCourse = $this->enrollmentService->addCourse($enrollment, $course);

        $this->activityLogs->record(
            $request,
            'added',
            'Course Loads',
            "Added {$course->course_code} to a student load.",
            $enrollmentCourse
        );

        return back();
    }

    public function destroy(Request $request, EnrollmentCourse $enrollmentCourse): RedirectResponse
    {
        $enrollmentCourse->loadMissing('course:id,course_code');
        $this->enrollmentService->removeCourse($enrollmentCourse);

        $this->activityLogs->record(
            $request,
            'dropped',
            'Course Loads',
            "Dropped {$enrollmentCourse->course?->course_code} from a student load.",
            $enrollmentCourse
        );

        return back();
    }

    public function restore(Request $request, EnrollmentCourse $enrollmentCourse): RedirectResponse
    {
        $enrollmentCourse->loadMissing('course:id,course_code');
        $this->enrollmentService->restoreCourse($enrollmentCourse);

        $this->activityLogs->record(
            $request,
            'restored',
            'Course Loads',
            "Restored {$enrollmentCourse->course?->course_code} to a student load.",
            $enrollmentCourse
        );

        return back();
    }

    public function credit(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'enrollment_id' => 'required|exists:enrollments,id',
            'course_id'     => 'required|exists:courses,id',
        ]);

        $enrollment = Enrollment::findOrFail($data['enrollment_id']);
        $course     = Course::findOrFail($data['course_id']);

        $enrollmentCourse = $this->enrollmentService->creditCourse($enrollment, $course);

        $this->activityLogs->record(
            $request,
            'credited',
            'Course Loads',
            "Credited {$course->course_code} for a student load.",
            $enrollmentCourse
        );

        return back();
    }

    /**
     * Override final_grade manually (INC resolution or correction).
     */
    public function overrideGrade(Request $request, EnrollmentCourse $enrollmentCourse): RedirectResponse
    {
        $data = $request->validate([
            'final_grade' => ['nullable', 'numeric', 'in:' . implode(',', GradeService::VALID_GRADES)],
        ]);

        $this->gradeService->overrideGrade(
            $enrollmentCourse,
            isset($data['final_grade']) ? (float) $data['final_grade'] : null
        );

        $this->activityLogs->record(
            $request,
            'overrode_grade',
            'Course Loads',
            'Overrode a student course grade.',
            $enrollmentCourse,
            ['final_grade' => $data['final_grade'] ?? null]
        );

        return back();
    }
}
