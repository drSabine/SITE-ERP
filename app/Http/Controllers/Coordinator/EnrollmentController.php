<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use App\Services\ActivityLogService;
use App\Services\EnrollmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    public function __construct(
        private EnrollmentService $service,
        private ActivityLogService $activityLogs,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search'     => ['nullable', 'string', 'max:100'],
            'term_id'    => ['nullable', 'integer', 'exists:academic_terms,id'],
            'program_id' => ['nullable', 'integer', 'exists:programs,id'],
            'year_level' => ['nullable', 'integer', 'min:1', 'max:5'],
            'section_id' => ['nullable', 'integer', 'exists:sections,id'],
            'status'     => ['nullable', Rule::in(['all', 'enrolled', 'completed', 'dropped'])],
            'has_inc'    => ['nullable', 'boolean'],
        ]);

        $scopedCodes = auth()->user()->coordinatorProgramCodes();

        $schoolYears = SchoolYear::with([
            'academicTerms' => fn ($q) => $q->orderByRaw("FIELD(semester, 'first', 'second', 'summer')")->select('id', 'school_year_id', 'semester', 'is_active'),
        ])->ordered()->get(['id', 'name']);

        $activeTerm = AcademicTerm::active()->first();
        $termId     = filled($filters['term_id'] ?? null) ? (int) $filters['term_id'] : $activeTerm?->id;

        $scopedProgramIds = $scopedCodes !== null
            ? Program::whereIn('code', $scopedCodes)->pluck('id')
            : null;

        $query = Enrollment::with([
            'student' => fn ($q) => $q->select('id', 'first_name', 'middle_name', 'last_name', 'suffix', 'program_id', 'status')
                ->with(['program:id,code']),
            'enrollmentCourses' => fn ($q) => $q->whereIn('status', ['active', 'inc'])->select('id', 'enrollment_id', 'status'),
            'section:id,name',
        ])
        ->where('academic_term_id', $termId ?? 0)
        ->orderBy('year_level', 'asc')
        ->orderByRaw('(SELECT last_name FROM students WHERE students.id = enrollments.student_id) ASC');

        if ($scopedProgramIds !== null) {
            $query->whereHas('student', fn ($q) => $q->whereIn('program_id', $scopedProgramIds));
        }

        if (filled($filters['search'] ?? null)) {
            $search = $filters['search'];
            $query->whereHas('student', fn ($q) => $q
                ->where('last_name', 'like', "%{$search}%")
                ->orWhere('first_name', 'like', "%{$search}%"));
        }

        if (filled($filters['program_id'] ?? null)) {
            $query->whereHas('student', fn ($q) => $q->where('program_id', $filters['program_id']));
        }

        if (filled($filters['year_level'] ?? null)) {
            $query->where('year_level', $filters['year_level']);
        }

        if (filled($filters['section_id'] ?? null)) {
            $query->where('section_id', $filters['section_id']);
        }

        if ($request->boolean('has_inc')) {
            $query->whereHas('enrollmentCourses', fn ($q) => $q->where('status', 'inc'));
        }

        $rawStatus    = $filters['status'] ?? '';
        $statusFilter = match(true) {
            $rawStatus === 'all' => null,
            $rawStatus !== ''    => $rawStatus,
            default              => 'enrolled',
        };

        if ($statusFilter) {
            $query->where('status', $statusFilter);
        }

        $programs = $scopedCodes !== null
            ? Program::active()->whereIn('code', $scopedCodes)->get(['id', 'code', 'name'])
            : Program::active()->get(['id', 'code', 'name']);

        $sectionsQuery = Section::active()
            ->whereHas('enrollments', fn ($q) => $q->where('academic_term_id', $termId ?? 0))
            ->with(['program:id,code'])
            ->orderBy('year_level')
            ->orderBy('name');
        if ($scopedProgramIds !== null) {
            $sectionsQuery->whereIn('program_id', $scopedProgramIds);
        }
        $sections = $sectionsQuery->get(['id', 'program_id', 'year_level', 'name']);

        $studentsQuery = Student::active()->ordered()->with(['program:id,code']);
        if ($scopedProgramIds !== null) {
            $studentsQuery->whereIn('program_id', $scopedProgramIds);
        }

        // Term-wide summary (independent of the page filters) so the overview tiles are stable.
        $summaryBase = Enrollment::where('academic_term_id', $termId ?? 0)
            ->where('status', 'enrolled')
            ->when($scopedProgramIds !== null, fn ($q) => $q->whereIn('program_id', $scopedProgramIds));
        $summaryTotal = (clone $summaryBase)->count();
        $summarySectioned = (clone $summaryBase)->whereNotNull('section_id')->count();
        $summaryWithInc = (clone $summaryBase)
            ->whereHas('enrollmentCourses', fn ($q) => $q->where('status', 'inc'))
            ->count();

        return Inertia::render('Coordinator/Enrollments/Index', [
            'enrollments'        => $query->paginate(10)->withQueryString(),
            'summary'            => [
                'total'     => $summaryTotal,
                'sectioned' => $summarySectioned,
                'noSection' => $summaryTotal - $summarySectioned,
                'withInc'   => $summaryWithInc,
            ],
            'schoolYears'        => $schoolYears,
            'programs'           => $programs,
            'sections'           => $sections,
            'selectedTermId'     => $termId,
            'filters'            => [
                'search'     => $filters['search'] ?? '',
                'term_id'    => $filters['term_id'] ?? '',
                'program_id' => $filters['program_id'] ?? '',
                'year_level' => $filters['year_level'] ?? '',
                'section_id' => $filters['section_id'] ?? '',
                'status'     => $rawStatus ?: 'enrolled',
                'has_inc'    => $request->boolean('has_inc'),
            ],
            'students'           => $studentsQuery->get(['id', 'first_name', 'last_name', 'year_level', 'program_id']),
            'enrolledStudentIds' => $termId
                ? Enrollment::where('academic_term_id', $termId)
                    ->whereIn('status', ['enrolled', 'completed'])
                    ->pluck('student_id')->all()
                : [],
            'droppedStudentIds'  => $termId
                ? Enrollment::where('academic_term_id', $termId)
                    ->where('status', 'dropped')
                    ->pluck('student_id')->all()
                : [],
        ]);
    }

    /**
     * Dedicated "Evaluate Student" page (replaces the New Evaluation modal).
     * Pick a student, preview the recommended curriculum for their year level, then enroll.
     */
    public function evaluate(): Response
    {
        $activeTerm = AcademicTerm::with('schoolYear:id,name')
            ->active()
            ->first(['id', 'school_year_id', 'semester', 'is_active']);
        abort_if(! $activeTerm, 404, 'No active academic term found.');

        $scopedCodes = auth()->user()->coordinatorProgramCodes();
        $scopedProgramIds = $scopedCodes !== null
            ? Program::whereIn('code', $scopedCodes)->pluck('id')
            : null;

        $students = Student::active()
            ->when($scopedProgramIds !== null, fn ($q) => $q->whereIn('program_id', $scopedProgramIds))
            ->whereDoesntHave('enrollments', fn ($q) => $q
                ->where('academic_term_id', $activeTerm->id)
                ->whereIn('status', ['enrolled', 'completed']))
            ->with('program:id,code,name')
            ->ordered()
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'suffix', 'program_id', 'year_level']);

        return Inertia::render('Coordinator/Enrollments/Evaluate', [
            'term'     => $activeTerm,
            'students' => $students,
        ]);
    }

    /**
     * JSON: the recommended curriculum block for a student + year level in the active term,
     * plus any outstanding INC carry-overs to resolve.
     */
    public function recommendation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'year_level' => 'required|integer|min:1|max:5',
        ]);

        $activeTerm = AcademicTerm::active()->first(['id', 'semester']);
        abort_if(! $activeTerm, 404, 'No active academic term found.');

        $student = Student::with('program:id,code')->findOrFail($data['student_id']);

        $courses = Course::active()
            ->where('program_id', $student->program_id)
            ->forSemester((int) $data['year_level'], $activeTerm->semester)
            ->orderBy('course_code')
            ->get(['id', 'course_code', 'title', 'units']);

        $incCourses = $this->service->getStudentIncCourses($student)
            ->map(fn ($ec) => ['course_code' => $ec->course?->course_code, 'title' => $ec->course?->title])
            ->values();

        return response()->json([
            'courses'    => $courses,
            'totalUnits' => (int) $courses->sum('units'),
            'incCourses' => $incCourses,
            'semester'   => $activeTerm->semester,
        ]);
    }

    /**
     * Dedicated full-page Manage Course Load screen (replaces the overloaded modal).
     */
    public function courseLoad(Enrollment $enrollment): Response
    {
        $scopedCodes = auth()->user()->coordinatorProgramCodes();

        $enrollment->load([
            'student:id,first_name,middle_name,last_name,suffix,program_id',
            'student.program:id,code,name',
            'academicTerm' => fn ($q) => $q->with(['schoolYear:id,name'])->select('id', 'school_year_id', 'semester'),
            'enrollmentCourses' => fn ($q) => $q->with(['course:id,course_code,title,units'])
                ->select('id', 'enrollment_id', 'course_id', 'final_grade', 'status'),
            'program:id,code',
            'section:id,name',
        ]);

        if ($scopedCodes !== null) {
            abort_unless(in_array($enrollment->student->program->code, $scopedCodes, true), 403);
        }

        $availableCourses = Course::active()
            ->where('program_id', $enrollment->student->program_id)
            ->with(['coRequisites' => fn ($q) => $q->select('courses.id', 'course_code', 'title')])
            ->orderBy('year_level')
            ->orderByRaw("FIELD(semester_type, 'first', 'second', 'summer')")
            ->get(['id', 'course_code', 'title', 'units', 'year_level', 'semester_type']);

        return Inertia::render('Coordinator/CourseLoad/Index', [
            'enrollment'       => $enrollment,
            'availableCourses' => $availableCourses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id'       => 'required|exists:students,id',
            'academic_term_id' => 'required|exists:academic_terms,id',
            'year_level'       => 'required|integer|min:1|max:5',
            'load_curriculum'  => 'sometimes|boolean',
        ]);

        $student = Student::findOrFail($data['student_id']);
        $term    = AcademicTerm::findOrFail($data['academic_term_id']);

        $enrollment = $this->service->enroll($student, $term, (int) $data['year_level']);

        if (! empty($data['load_curriculum'])) {
            try {
                $this->service->loadStandardCurriculum($enrollment);
            } catch (\Throwable $throwable) {
                // Enrollment is created; curriculum load failure is non-fatal.
            }
        }

        $this->activityLogs->record(
            $request,
            'created',
            'Enrollments',
            "Enrolled {$student->first_name} {$student->last_name} in an academic term.",
            $enrollment,
            ['load_curriculum' => ! empty($data['load_curriculum'])]
        );

        return back();
    }

    public function storeForSchoolYear(Request $request): RedirectResponse
    {
        $activeSchoolYearId = SchoolYear::active()->value('id');

        if (! $activeSchoolYearId) {
            return back()->withErrors(['term_ids' => 'No active school year found.']);
        }

        $data = $request->validate([
            'student_id'      => 'required|exists:students,id',
            'term_ids'        => 'required|array|min:1',
            'term_ids.*'      => ['integer', Rule::exists('academic_terms', 'id')->where('school_year_id', $activeSchoolYearId)],
            'year_level'      => 'required|integer|min:1|max:5',
            'load_curriculum' => 'sometimes|boolean',
        ]);

        $student = Student::findOrFail($data['student_id']);
        $terms   = AcademicTerm::findMany($data['term_ids']);

        $createdCount = 0;

        foreach ($terms as $term) {
            if (Enrollment::where('student_id', $student->id)
                ->where('academic_term_id', $term->id)
                ->exists()
            ) {
                continue;
            }

            $enrollment = $this->service->enroll($student, $term, (int) $data['year_level']);

            if (! empty($data['load_curriculum'])) {
                try {
                    $this->service->loadStandardCurriculum($enrollment);
                } catch (\Throwable $throwable) {
                    // Non-fatal — enrollment row is created regardless
                }
            }

            $createdCount++;
        }

        $this->activityLogs->record(
            $request,
            'created',
            'Enrollments',
            "Enrolled {$student->first_name} {$student->last_name} in {$createdCount} term(s) for the school year.",
            $student,
            ['created_terms' => $createdCount, 'load_curriculum' => ! empty($data['load_curriculum'])]
        );

        return back();
    }

    /**
     * Auto-populate courses from the standard BSIT/BSCE curriculum
     * for the student's current year_level + this term's semester.
     */
    public function loadCurriculum(Request $request, Enrollment $enrollment): RedirectResponse
    {
        $enrollment->load(['student', 'academicTerm']);

        $count = $this->service->loadStandardCurriculum($enrollment);

        $this->activityLogs->record(
            $request,
            'loaded_curriculum',
            'Enrollments',
            "Loaded {$count} curriculum course(s) for an enrollment.",
            $enrollment,
            ['course_count' => $count]
        );

        return back()->with('success', "{$count} course(s) loaded from the standard curriculum.");
    }

    public function drop(Request $request, Enrollment $enrollment): RedirectResponse
    {
        $this->service->dropEnrollment($enrollment);

        $this->activityLogs->record(
            $request,
            'dropped',
            'Enrollments',
            'Dropped an enrollment.',
            $enrollment
        );

        return back();
    }
}
