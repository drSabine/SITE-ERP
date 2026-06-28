<?php

namespace App\Services;

use App\Models\Course;
use App\Models\SchoolYear;
use App\Models\Student;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GraduationService
{
    /**
     * Students eligible to graduate: every active course in their program's curriculum has been
     * passed or credited, and they have no pending work (no 'active' or 'inc' enrollment_courses).
     *
     * Returns a row per eligible student with progress detail for the coordinator to validate.
     */
    public function candidates(?array $programIds): Collection
    {
        $students = Student::active()
            ->when($programIds !== null, fn ($query) => $query->whereIn('program_id', $programIds))
            ->with('program:id,code,name')
            ->orderBy('year_level', 'desc')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'suffix', 'program_id', 'year_level']);

        if ($students->isEmpty()) {
            return collect();
        }

        // Required curriculum course ids per program.
        $requiredByProgram = Course::active()
            ->get(['id', 'program_id'])
            ->groupBy('program_id')
            ->map(fn ($group) => $group->pluck('id')->all());

        // Every enrollment_course for these students, grouped by student.
        $rowsByStudent = DB::table('enrollment_courses as ec')
            ->join('enrollments as e', 'e.id', '=', 'ec.enrollment_id')
            ->whereIn('e.student_id', $students->pluck('id'))
            ->get(['e.student_id', 'ec.course_id', 'ec.status'])
            ->groupBy('student_id');

        return $students->map(function ($student) use ($requiredByProgram, $rowsByStudent) {
            $rows = $rowsByStudent->get($student->id, collect());
            $required = collect($requiredByProgram->get($student->program_id, []));
            $passed = $rows->whereIn('status', ['passed', 'credited'])->pluck('course_id')->unique();
            $pending = $rows->whereIn('status', ['active', 'inc'])->count();
            $remaining = $required->diff($passed);

            return [
                'id'          => $student->id,
                'name'        => trim("{$student->last_name}, {$student->first_name}" . ($student->suffix ? " {$student->suffix}" : '')),
                'program'     => $student->program?->code,
                'year_level'  => $student->year_level,
                'required'    => $required->count(),
                'completed'   => $required->intersect($passed)->count(),
                'pending'     => $pending,
                'eligible'    => $pending === 0 && $required->isNotEmpty() && $remaining->isEmpty(),
            ];
        })->filter(fn ($row) => $row['eligible'])->values();
    }

    public function isEligible(Student $student): bool
    {
        $required = Course::active()->where('program_id', $student->program_id)->pluck('id');
        if ($required->isEmpty()) {
            return false;
        }

        $rows = DB::table('enrollment_courses as ec')
            ->join('enrollments as e', 'e.id', '=', 'ec.enrollment_id')
            ->where('e.student_id', $student->id)
            ->get(['ec.course_id', 'ec.status']);

        $pending = $rows->whereIn('status', ['active', 'inc'])->count();
        $passed = $rows->whereIn('status', ['passed', 'credited'])->pluck('course_id')->unique();

        return $pending === 0 && $required->diff($passed)->isEmpty();
    }

    /**
     * Confirm a graduation: status -> graduated, recorded against the active school year.
     */
    public function graduate(Student $student): void
    {
        $activeSchoolYear = SchoolYear::active()->first(['id']);

        $student->update([
            'status'                    => 'graduated',
            'graduated_school_year_id'  => $activeSchoolYear?->id,
            'graduated_at'              => now(),
        ]);
    }
}
