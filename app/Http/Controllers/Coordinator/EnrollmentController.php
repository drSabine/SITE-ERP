<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Services\ActivityLogService;
use App\Services\EnrollmentService;
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
        $scopedCodes = auth()->user()->coordinatorProgramCodes();

        $schoolYears = SchoolYear::with([
            'academicTerms' => fn ($q) => $q->orderByRaw("FIELD(semester, 'first', 'second', 'summer')")->select('id', 'school_year_id', 'semester', 'is_active'),
        ])->ordered()->get(['id', 'name']);

        $activeTerm = AcademicTerm::active()->first();
        $termId     = $request->filled('term_id') ? (int) $request->term_id : $activeTerm?->id;

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

        if ($request->filled('program_id')) {
            $query->whereHas('student', fn ($q) => $q->where('program_id', $request->program_id));
        }

        if ($request->filled('year_level')) {
            $query->where('year_level', $request->year_level);
        }

        $rawStatus    = $request->input('status', '');
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

        $studentsQuery = Student::active()->ordered()->with(['program:id,code']);
        if ($scopedProgramIds !== null) {
            $studentsQuery->whereIn('program_id', $scopedProgramIds);
        }

        return Inertia::render('Coordinator/Enrollments/Index', [
            'enrollments'        => $query->paginate(15)->withQueryString(),
            'schoolYears'        => $schoolYears,
            'programs'           => $programs,
            'selectedTermId'     => $termId,
            'filters'            => [
                'term_id'    => $request->input('term_id', ''),
                'program_id' => $request->input('program_id', ''),
                'year_level' => $request->input('year_level', ''),
                'status'     => $rawStatus ?: 'enrolled',
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
        $activeSchoolYearId = SchoolYear::where('is_active', true)->value('id');

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
