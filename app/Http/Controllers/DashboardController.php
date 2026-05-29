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

        $activeTerm = AcademicTerm::active()
            ->with(['schoolYear:id,name'])
            ->first(['id', 'school_year_id', 'semester', 'is_active']);

        // Admin, coordinator, and teacher can all carry a teaching load for the active term.
        // The frontend shows the Teaching section only when this is true (or role === teacher).
        $hasTeachingLoad = in_array($role, ['admin', 'coordinator', 'teacher']) && $activeTerm
            ? $user->teacherAssignments()->where('academic_term_id', $activeTerm->id)->exists()
            : false;

        $props = [
            'activeTerm'      => $activeTerm,
            'hasTeachingLoad' => $hasTeachingLoad,
        ];

        if ($role === 'admin') {
            $props['studentCount']  = Student::active()->count();
            $props['enrolledCount'] = $activeTerm
                ? $activeTerm->enrollments()->where('status', 'enrolled')->count()
                : 0;
        }

        if ($role === 'coordinator') {
            $props['incCount'] = $activeTerm
                ? EnrollmentCourse::withInc()
                    ->whereHas('enrollment', fn($query) => $query->where('academic_term_id', $activeTerm->id))
                    ->count()
                : 0;
        }

        return Inertia::render('Dashboard', $props);
    }
}
