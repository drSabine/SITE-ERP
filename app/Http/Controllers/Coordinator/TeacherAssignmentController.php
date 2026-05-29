<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\Course;
use App\Models\TeacherAssignment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeacherAssignmentController extends Controller
{
    public function index(Request $request): Response
    {
        $request->validate(['academic_term_id' => 'required|exists:academic_terms,id']);

        $term = AcademicTerm::with(['schoolYear:id,name'])
            ->findOrFail($request->academic_term_id, ['id', 'school_year_id', 'semester']);

        return Inertia::render('Coordinator/Assignments/Index', [
            'term'        => $term,
            'assignments' => TeacherAssignment::where('academic_term_id', $term->id)
                ->with([
                    'teacher' => fn($query) => $query->select('id', 'name')->with(['userProfile:user_id,first_name,last_name']),
                    'course:id,course_code,title,units',
                ])
                ->get(['id', 'teacher_id', 'course_id', 'academic_term_id']),
            'teachers'    => User::teachers()->active()
                ->with(['userProfile:user_id,first_name,last_name'])
                ->get(['id', 'name']),
            'courses'     => Course::active()->get(['id', 'course_code', 'title', 'units']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'teacher_id'       => 'required|exists:users,id',
            'course_id'        => 'required|exists:courses,id',
            'academic_term_id' => 'required|exists:academic_terms,id',
        ]);

        // Ensure teacher role
        $teacher = User::findOrFail($data['teacher_id']);
        abort_if($teacher->role !== 'teacher', 422, 'Selected user is not a teacher.');

        // Unique per course per term
        $exists = TeacherAssignment::where('course_id', $data['course_id'])
            ->where('academic_term_id', $data['academic_term_id'])
            ->exists();

        abort_if($exists, 422, 'This course already has a teacher assigned for this term.');

        TeacherAssignment::create($data);

        return back();
    }

    public function destroy(TeacherAssignment $teacherAssignment): RedirectResponse
    {
        $teacherAssignment->delete();
        return back();
    }
}
