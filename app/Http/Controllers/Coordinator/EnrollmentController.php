<?php

namespace App\Http\Controllers\Coordinator;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Services\EnrollmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    public function __construct(private EnrollmentService $service) {}

    public function index(Request $request): Response
    {
        $schoolYears = SchoolYear::with([
            'academicTerms' => fn ($q) => $q->orderByRaw("FIELD(semester, 'first', 'second', 'summer')")->select('id', 'school_year_id', 'semester', 'is_active'),
        ])->ordered()->get(['id', 'name']);

        $activeTerm = AcademicTerm::active()->first();
        $termId     = $request->filled('term_id') ? (int) $request->term_id : $activeTerm?->id;

        $query = Enrollment::with([
            'student' => fn ($q) => $q->select('id', 'student_number', 'first_name', 'middle_name', 'last_name', 'suffix', 'program_id', 'status')
                ->with(['program:id,code']),
            'enrollmentCourses' => fn ($q) => $q->whereIn('status', ['active', 'inc'])->select('id', 'enrollment_id', 'status'),
        ])
        ->where('academic_term_id', $termId ?? 0)
        ->orderBy('year_level', 'asc')
        ->orderByRaw('(SELECT last_name FROM students WHERE students.id = enrollments.student_id) ASC');

        if ($request->filled('program_id')) {
            $query->whereHas('student', fn ($q) => $q->where('program_id', $request->program_id));
        }

        if ($request->filled('year_level')) {
            $query->where('year_level', $request->year_level);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return Inertia::render('Coordinator/Enrollments/Index', [
            'enrollments'    => $query->paginate(15)->withQueryString(),
            'schoolYears'    => $schoolYears,
            'programs'       => Program::active()->get(['id', 'code', 'name']),
            'selectedTermId' => $termId,
            'filters'        => $request->only(['term_id', 'program_id', 'year_level', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id'       => 'required|exists:students,id',
            'academic_term_id' => 'required|exists:academic_terms,id',
            'year_level'       => 'required|integer|min:1|max:4',
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

        return back();
    }

    public function storeForSchoolYear(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id'      => 'required|exists:students,id',
            'term_ids'        => 'required|array|min:1',
            'term_ids.*'      => 'exists:academic_terms,id',
            'year_level'      => 'required|integer|min:1|max:4',
            'load_curriculum' => 'sometimes|boolean',
        ]);

        $student = Student::findOrFail($data['student_id']);
        $terms   = AcademicTerm::findMany($data['term_ids']);

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
        }

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
