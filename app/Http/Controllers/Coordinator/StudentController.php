<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Program;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function __construct(private ActivityLogService $activityLogs) {}

    private function scopedPrograms(): ?array
    {
        return auth()->user()->coordinatorProgramCodes();
    }

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search'     => ['nullable', 'string', 'max:100'],
            'program_id' => ['nullable', 'integer', 'exists:programs,id'],
            'year_level' => ['nullable', 'integer', 'min:1', 'max:5'],
            'status'     => ['nullable', Rule::in(['active', 'graduated', 'transferred', 'dropped', 'leave_of_absence'])],
        ]);

        $scopedCodes = $this->scopedPrograms();

        $activeSchoolYear = SchoolYear::active()
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
                ->where('status', 'enrolled')
                ->select('id', 'student_id', 'academic_term_id', 'year_level', 'status'),
        ])
        ->orderBy('year_level', 'asc')
        ->orderBy('last_name', 'asc')
        ->orderBy('first_name', 'asc');

        if ($scopedCodes !== null) {
            $scopedProgramIds = Program::whereIn('code', $scopedCodes)->pluck('id');
            $query->whereIn('program_id', $scopedProgramIds);
        }

        if (filled($filters['search'] ?? null)) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('last_name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%");
            });
        }

        if (filled($filters['program_id'] ?? null)) {
            $query->where('program_id', $filters['program_id']);
        }

        if (filled($filters['year_level'] ?? null)) {
            $query->where('year_level', $filters['year_level']);
        }

        $query->where('status', $filters['status'] ?? 'active');

        $programs = $scopedCodes !== null
            ? Program::active()->whereIn('code', $scopedCodes)->get(['id', 'code', 'name'])
            : Program::active()->get(['id', 'code', 'name']);

        return Inertia::render('Coordinator/Students/Index', [
            'students'         => $query->paginate(10)->withQueryString(),
            'programs'         => $programs,
            'activeSchoolYear' => $activeSchoolYear,
            'schoolYears'      => SchoolYear::with([
                'academicTerms' => fn ($q) => $q->orderByRaw("FIELD(semester, 'first', 'second', 'summer')")->select('id', 'school_year_id', 'semester', 'is_active'),
            ])->ordered()->get(['id', 'name']),
            'filters'          => [
                'search'     => $filters['search'] ?? '',
                'program_id' => $filters['program_id'] ?? '',
                'year_level' => $filters['year_level'] ?? '',
                'status'     => $filters['status'] ?? 'active',
            ],
        ]);
    }

    public function detail(Student $student): JsonResponse
    {
        $student->load([
            'program:id,code,name',
            'enrollments' => fn ($q) => $q->with([
                'academicTerm' => fn ($q) => $q->with(['schoolYear:id,name,is_active'])->select('id', 'school_year_id', 'semester', 'is_active'),
                'enrollmentCourses' => fn ($q) => $q->with(['course:id,course_code,title,units'])
                    ->select('id', 'enrollment_id', 'course_id', 'final_grade', 'status'),
                'program:id,code',
                'section:id,name',
            ])->orderByDesc('id'),
        ]);

        $availableCourses = Course::active()
            ->where('program_id', $student->program_id)
            ->with(['coRequisites' => fn ($q) => $q->select('courses.id', 'course_code', 'title')])
            ->orderBy('year_level')
            ->orderByRaw("FIELD(semester_type, 'first', 'second', 'summer')")
            ->get(['id', 'course_code', 'title', 'units', 'year_level', 'semester_type']);

        return response()->json([
            'student'          => $student,
            'availableCourses' => $availableCourses,
        ]);
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        $data = $request->validate([
            'program_id'     => 'required|exists:programs,id',
            'year_level'     => 'required|integer|min:1|max:5',
            'status'         => 'required|in:active,graduated,transferred,dropped,leave_of_absence',
            'remarks'        => 'nullable|string',
        ]);

        $student->update($data);

        $this->activityLogs->record(
            $request,
            'updated',
            'Students',
            "Updated student record for {$student->first_name} {$student->last_name}.",
            $student
        );

        return back();
    }

    public function destroy(Request $request, Student $student): RedirectResponse
    {
        if ($student->enrollments()->exists()) {
            return back()->with('error', 'Cannot delete student with enrollment records.');
        }

        $student->delete();

        $this->activityLogs->record(
            $request,
            'deleted',
            'Students',
            "Deleted student record for {$student->first_name} {$student->last_name}.",
            $student
        );

        return back()->with('success', 'Student deleted successfully.');
    }
}
