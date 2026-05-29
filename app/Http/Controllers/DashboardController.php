<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\EnrollmentCourse;
use App\Models\Student;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $role = $user->role;

        $shared = [
            'role' => $role,
        ];

        if ($role === 'admin') {
            return Inertia::render('Admin/Dashboard', array_merge($shared, $this->adminData()));
        }

        if ($role === 'coordinator') {
            return Inertia::render('Coordinator/Dashboard', array_merge($shared, $this->coordinatorData()));
        }

        // Teacher
        return Inertia::render('Teacher/Dashboard', array_merge($shared, $this->teacherData($user)));
    }

    private function adminData(): array
    {
        $activeTerm = AcademicTerm::active()
            ->with(['schoolYear:id,name'])
            ->first(['id', 'school_year_id', 'semester', 'is_active']);

        return [
            'activeTerm'     => $activeTerm,
            'studentCount'   => Student::active()->count(),
            'enrolledCount'  => $activeTerm
                ? $activeTerm->enrollments()->where('status', 'enrolled')->count()
                : 0,
        ];
    }

    private function coordinatorData(): array
    {
        $activeTerm = AcademicTerm::active()
            ->with(['schoolYear:id,name'])
            ->first(['id', 'school_year_id', 'semester', 'is_active']);

        $incCount = $activeTerm
            ? EnrollmentCourse::withInc()
                ->whereHas('enrollment', fn($q) => $q->where('academic_term_id', $activeTerm->id))
                ->count()
            : 0;

        return [
            'activeTerm' => $activeTerm,
            'incCount'   => $incCount,
        ];
    }

    private function teacherData($user): array
    {
        $activeTerm = AcademicTerm::active()->first(['id', 'semester']);

        $assignments = $activeTerm
            ? $user->teacherAssignments()
                ->where('academic_term_id', $activeTerm->id)
                ->with(['course:id,course_code,title,units'])
                ->get(['id', 'teacher_id', 'course_id', 'academic_term_id'])
            : collect();

        return [
            'activeTerm'  => $activeTerm,
            'assignments' => $assignments,
        ];
    }
}
