<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\Course;
use App\Models\Program;
use App\Models\SchoolYear;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)
            ->with(['academicTerms' => fn ($q) => $q
                ->orderByRaw("FIELD(semester, 'first', 'second', 'summer')")
                ->select('id', 'school_year_id', 'semester', 'is_active')])
            ->first(['id', 'name']);

        $activeTermIds = $activeSchoolYear
            ? $activeSchoolYear->academicTerms->pluck('id')
            : collect();

        $query = Student::with([
            'program:id,code',
            'enrollments' => fn ($q) => $q
                ->whereIn('academic_term_id', $activeTermIds)
                ->select('id', 'student_id', 'academic_term_id', 'year_level', 'status'),
        ])
        ->orderBy('year_level', 'asc')
        ->orderBy('last_name', 'asc')
        ->orderBy('first_name', 'asc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('last_name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('student_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('program_id')) {
            $query->where('program_id', $request->program_id);
        }

        if ($request->filled('year_level')) {
            $query->where('year_level', $request->year_level);
        }

        $query->where('status', $request->filled('status') ? $request->status : 'active');

        return Inertia::render('Coordinator/Students/Index', [
            'students'         => $query->paginate(20)->withQueryString(),
            'programs'         => Program::active()->get(['id', 'code', 'name']),
            'activeSchoolYear' => $activeSchoolYear,
            'schoolYears'      => SchoolYear::with([
                'academicTerms' => fn ($q) => $q->orderByRaw("FIELD(semester, 'first', 'second', 'summer')")->select('id', 'school_year_id', 'semester', 'is_active'),
            ])->ordered()->get(['id', 'name']),
            'filters'          => $request->only(['search', 'program_id', 'year_level', 'status']),
        ]);
    }

    public function detail(Student $student): JsonResponse
    {
        $student->load([
            'program:id,code,name',
            'enrollments' => fn ($q) => $q->with([
                'academicTerm' => fn ($q) => $q->with(['schoolYear:id,name'])->select('id', 'school_year_id', 'semester', 'is_active'),
                'enrollmentCourses' => fn ($q) => $q->with(['course:id,course_code,title,units'])
                    ->select('id', 'enrollment_id', 'course_id', 'final_grade', 'status'),
            ])->orderByDesc('id'),
        ]);

        $availableCourses = Course::active()
            ->where('program_id', $student->program_id)
            ->orderBy('year_level')
            ->orderByRaw("FIELD(semester_type, 'first', 'second', 'summer')")
            ->get(['id', 'course_code', 'title', 'units', 'year_level', 'semester_type']);

        return response()->json([
            'student'          => $student,
            'availableCourses' => $availableCourses,
        ]);
    }

    public function show(Request $request, Student $student): Response|JsonResponse
    {
        $student->load([
            'program:id,code,name',
            'enrollments' => fn ($q) => $q->with([
                'academicTerm' => fn ($q) => $q->with(['schoolYear:id,name'])->select('id', 'school_year_id', 'semester', 'is_active'),
                'enrollmentCourses' => fn ($q) => $q->with(['course:id,course_code,title,units'])
                    ->select('id', 'enrollment_id', 'course_id', 'final_grade', 'status'),
            ])->orderByDesc('id'),
        ]);

        $availableCourses = Course::active()
            ->where('program_id', $student->program_id)
            ->orderBy('year_level')
            ->orderByRaw("FIELD(semester_type, 'first', 'second', 'summer')")
            ->get(['id', 'course_code', 'title', 'units', 'year_level', 'semester_type']);

        if ($request->wantsJson()) {
            return response()->json([
                'student'          => $student,
                'availableCourses' => $availableCourses,
            ]);
        }

        return Inertia::render('Coordinator/Students/Show', [
            'student'          => $student,
            'availableCourses' => $availableCourses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_number' => 'required|string|max:30|unique:students,student_number',
            'first_name'     => 'required|string|max:100',
            'middle_name'    => 'nullable|string|max:100',
            'last_name'      => 'required|string|max:100',
            'suffix'         => 'nullable|string|max:20',
            'sex'            => 'required|in:Male,Female',
            'birthdate'      => 'required|date',
            'address'        => 'nullable|string',
            'contact_number' => 'nullable|string|max:30',
            'email'          => 'nullable|email|max:191',
            'program_id'     => 'required|exists:programs,id',
            'year_level'     => 'required|integer|min:1|max:4',
            'remarks'        => 'nullable|string',
        ]);

        Student::create($data);

        return back();
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        $data = $request->validate([
            'student_number' => 'required|string|max:30|unique:students,student_number,' . $student->id,
            'first_name'     => 'required|string|max:100',
            'middle_name'    => 'nullable|string|max:100',
            'last_name'      => 'required|string|max:100',
            'suffix'         => 'nullable|string|max:20',
            'sex'            => 'required|in:Male,Female',
            'birthdate'      => 'required|date',
            'address'        => 'nullable|string',
            'contact_number' => 'nullable|string|max:30',
            'email'          => 'nullable|email|max:191',
            'program_id'     => 'required|exists:programs,id',
            'year_level'     => 'required|integer|min:1|max:4',
            'status'         => 'required|in:active,graduated,transferred,dropped,leave_of_absence',
            'remarks'        => 'nullable|string',
        ]);

        $student->update($data);

        return back();
    }

    public function destroy(Student $student): RedirectResponse
    {
        if ($student->enrollments()->exists()) {
            return back()->with('error', 'Cannot delete student with enrollment records.');
        }

        $student->delete();

        return back()->with('success', 'Student deleted successfully.');
    }
}
