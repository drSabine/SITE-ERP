<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Program;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                ->with([
                    'prerequisites' => fn ($query) => $query
                        ->wherePivot('type', 'prerequisite')
                        ->select('courses.id', 'courses.course_code', 'courses.title'),
                    'coRequisites' => fn ($query) => $query
                        ->select('courses.id', 'courses.course_code', 'courses.title'),
                ])
                ->orderBy('year_level')
                ->orderBy('semester_type')
                ->orderBy('course_code')
                ->get(['id', 'program_id', 'course_code', 'title', 'units', 'lec_hours', 'lab_hours', 'year_level', 'semester_type', 'is_active']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'program_id'         => 'required|exists:programs,id',
            'course_code'        => 'required|string|max:50',
            'title'              => 'required|string|max:191',
            'units'              => 'required|integer|min:1|max:9',
            'lec_hours'          => 'required|integer|min:0',
            'lab_hours'          => 'required|integer|min:0',
            'year_level'         => 'nullable|integer|min:1|max:4',
            'semester_type'      => 'nullable|in:first,second,summer',
            'prerequisite_ids'   => 'sometimes|array',
            'prerequisite_ids.*' => 'exists:courses,id',
            'co_requisite_ids'   => 'sometimes|array',
            'co_requisite_ids.*' => 'exists:courses,id',
            'force_units'        => 'sometimes|boolean',
        ]);

        $exists = Course::where('program_id', $data['program_id'])
            ->where('course_code', $data['course_code'])
            ->where('title', $data['title'])
            ->exists();

        abort_if($exists, 422, 'This course already exists for this program.');

        if (! $request->boolean('force_units') && ! empty($data['year_level']) && ! empty($data['semester_type'])) {
            $semesterTotal = Course::where('program_id', $data['program_id'])
                ->where('year_level', $data['year_level'])
                ->where('semester_type', $data['semester_type'])
                ->sum('units');

            if (($semesterTotal + $data['units']) > 26) {
                return back()->withErrors([
                    'over_unit_limit' => "Adding this course ({$data['units']} units) would bring the semester total to " . ($semesterTotal + $data['units']) . " units, exceeding the 26-unit guideline.",
                ]);
            }
        }

        $course = Course::create(
            collect($data)->except(['prerequisite_ids', 'co_requisite_ids', 'force_units'])->all()
        );

        $this->syncCourseRelationships($course, $data['prerequisite_ids'] ?? [], $data['co_requisite_ids'] ?? []);

        return back();
    }

    public function update(Request $request, Course $course): RedirectResponse
    {
        $data = $request->validate([
            'course_code'        => 'required|string|max:50',
            'title'              => 'required|string|max:191',
            'units'              => 'required|integer|min:1|max:9',
            'lec_hours'          => 'required|integer|min:0',
            'lab_hours'          => 'required|integer|min:0',
            'year_level'         => 'nullable|integer|min:1|max:4',
            'semester_type'      => 'nullable|in:first,second,summer',
            'is_active'          => 'boolean',
            'prerequisite_ids'   => 'sometimes|array',
            'prerequisite_ids.*' => 'exists:courses,id',
            'co_requisite_ids'   => 'sometimes|array',
            'co_requisite_ids.*' => 'exists:courses,id',
            'force_units'        => 'sometimes|boolean',
        ]);

        if (! $request->boolean('force_units') && ! empty($data['year_level']) && ! empty($data['semester_type'])) {
            $semesterTotal = Course::where('program_id', $course->program_id)
                ->where('year_level', $data['year_level'])
                ->where('semester_type', $data['semester_type'])
                ->where('id', '!=', $course->id)
                ->sum('units');

            if (($semesterTotal + $data['units']) > 26) {
                return back()->withErrors([
                    'over_unit_limit' => "This would bring the semester total to " . ($semesterTotal + $data['units']) . " units, exceeding the 26-unit guideline.",
                ]);
            }
        }

        $course->update(
            collect($data)->except(['prerequisite_ids', 'co_requisite_ids', 'force_units'])->all()
        );

        $this->syncCourseRelationships($course, $data['prerequisite_ids'] ?? [], $data['co_requisite_ids'] ?? []);

        return back();
    }

    private function syncCourseRelationships(Course $course, array $prerequisiteIds, array $coRequisiteIds): void
    {
        DB::table('course_prerequisites')
            ->where('course_id', $course->id)
            ->delete();

        $rows = [];

        foreach ($prerequisiteIds as $id) {
            $rows[] = [
                'course_id'       => $course->id,
                'prerequisite_id' => $id,
                'type'            => 'prerequisite',
                'created_at'      => now(),
                'updated_at'      => now(),
            ];
        }

        foreach ($coRequisiteIds as $id) {
            $rows[] = [
                'course_id'       => $course->id,
                'prerequisite_id' => $id,
                'type'            => 'co_requisite',
                'created_at'      => now(),
                'updated_at'      => now(),
            ];
        }

        if (! empty($rows)) {
            DB::table('course_prerequisites')->insert($rows);
        }
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
