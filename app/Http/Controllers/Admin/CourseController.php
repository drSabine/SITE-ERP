<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Program;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function index(Request $request): Response
    {
        $request->validate(['program_id' => 'required|exists:programs,id']);

        return Inertia::render('Admin/Courses/Index', [
            'program' => Program::findOrFail($request->program_id, ['id', 'code', 'name']),
            'courses' => Course::where('program_id', $request->program_id)
                ->orderBy('year_level')
                ->orderBy('semester_type')
                ->orderBy('course_code')
                ->get(['id', 'program_id', 'course_code', 'title', 'units', 'lec_hours', 'lab_hours', 'year_level', 'semester_type', 'is_active']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'program_id'    => 'required|exists:programs,id',
            'course_code'   => 'required|string|max:50',
            'title'         => 'required|string|max:191',
            'units'         => 'required|integer|min:1|max:9',
            'lec_hours'     => 'required|integer|min:0',
            'lab_hours'     => 'required|integer|min:0',
            'year_level'    => 'nullable|integer|min:1|max:4',
            'semester_type' => 'nullable|in:first,second,summer',
        ]);

        // Unique course_code per program
        $exists = Course::where('program_id', $data['program_id'])
            ->where('course_code', $data['course_code'])
            ->exists();

        abort_if($exists, 422, 'Course code already exists for this program.');

        Course::create($data);

        return back();
    }

    public function update(Request $request, Course $course): RedirectResponse
    {
        $data = $request->validate([
            'course_code'   => 'required|string|max:50',
            'title'         => 'required|string|max:191',
            'units'         => 'required|integer|min:1|max:9',
            'lec_hours'     => 'required|integer|min:0',
            'lab_hours'     => 'required|integer|min:0',
            'year_level'    => 'nullable|integer|min:1|max:4',
            'semester_type' => 'nullable|in:first,second,summer',
            'is_active'     => 'boolean',
        ]);

        $course->update($data);

        return back();
    }

    public function destroy(Course $course): RedirectResponse
    {
        abort_if(
            $course->enrollmentCourses()->exists(),
            422,
            'Cannot delete a course with existing enrollment records.'
        );

        $course->delete();

        return back();
    }
}
