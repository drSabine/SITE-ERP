<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\Enrollment;
use App\Models\Student;
use App\Services\EnrollmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function __construct(private EnrollmentService $service) {}

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id'       => 'required|exists:students,id',
            'academic_term_id' => 'required|exists:academic_terms,id',
        ]);

        $student = Student::findOrFail($data['student_id']);
        $term    = AcademicTerm::findOrFail($data['academic_term_id']);

        $this->service->enroll($student, $term);

        return back();
    }

    /**
     * Auto-populate courses from the standard BSIT/BSCE curriculum
     * for the student's current year_level + this term's semester.
     */
    public function loadCurriculum(Enrollment $enrollment): RedirectResponse
    {
        $enrollment->load(['student', 'academicTerm']);

        $count = $this->service->loadStandardCurriculum($enrollment);

        return back()->with('success', "{$count} course(s) loaded from the standard curriculum.");
    }

    public function drop(Enrollment $enrollment): RedirectResponse
    {
        $this->service->dropEnrollment($enrollment);
        return back();
    }
}
