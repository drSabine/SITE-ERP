<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\EnrollmentCourse;
use Inertia\Inertia;
use Inertia\Response;

class DeficiencyController extends Controller
{
    /**
     * List all students with INC subjects in the given academic term.
     * Coordinator uses this to track and resolve deficiencies.
     */
    public function index(AcademicTerm $academicTerm): Response
    {
        $incCourses = EnrollmentCourse::withInc()
            ->whereHas('enrollment', fn($q) => $q->where('academic_term_id', $academicTerm->id))
            ->with([
                'course:id,course_code,title',
                'enrollment' => fn($q) => $q->select('id', 'student_id', 'academic_term_id')
                    ->with(['student' => fn($q) => $q->select('id', 'first_name', 'last_name', 'year_level', 'program_id')
                        ->with(['program:id,code'])]),
            ])
            ->get(['id', 'enrollment_id', 'course_id', 'final_grade', 'status']);

        $term = $academicTerm->load(['schoolYear:id,name']);

        return Inertia::render('Coordinator/Deficiencies/Index', [
            'term'       => $term,
            'incCourses' => $incCourses,
        ]);
    }
}
