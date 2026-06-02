<?php

namespace App\Services;

use App\Models\TeacherAssignment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class GradingMonitorService
{
    public function getPaginatedAssignments(array $filters = [], ?array $scopedProgramIds = null): LengthAwarePaginator
    {
        $query = TeacherAssignment::query()
            ->with([
                'teacher' => fn ($builder) => $builder
                    ->select('id', 'name')
                    ->with(['userProfile:user_id,first_name,last_name']),
                'course:id,course_code,title,units',
                'section:id,program_id,year_level,name',
                'section.program:id,code,name',
                'academicTerm:id,school_year_id,semester',
                'academicTerm.schoolYear:id,name',
            ])
            ->when($filters['term_id'] ?? null, fn ($builder, $termId) => $builder->where('academic_term_id', $termId))
            ->when($filters['teacher_id'] ?? null, fn ($builder, $teacherId) => $builder->where('teacher_id', $teacherId))
            ->when($filters['section_id'] ?? null, fn ($builder, $sectionId) => $builder->where('section_id', $sectionId))
            ->when($filters['program_id'] ?? null, fn ($builder, $programId) => $builder->whereHas('section', fn ($sectionQuery) => $sectionQuery->where('program_id', $programId)))
            ->when($filters['year_level'] ?? null, fn ($builder, $yearLevel) => $builder->whereHas('section', fn ($sectionQuery) => $sectionQuery->where('year_level', $yearLevel)))
            ->when($scopedProgramIds !== null, fn ($builder) => $builder->whereHas('section', fn ($sectionQuery) => $sectionQuery->whereIn('program_id', $scopedProgramIds)))
            ->orderByDesc('academic_term_id')
            ->orderBy('section_id')
            ->orderBy('course_id');

        $paginator = $query->paginate(10)->withQueryString();

        $assignmentIds = collect($paginator->items())->pluck('id')->all();

        $metrics = empty($assignmentIds)
            ? collect()
            : DB::table('teacher_assignments as ta')
                ->leftJoin('enrollments as e', function ($join) {
                    $join->on('e.academic_term_id', '=', 'ta.academic_term_id')
                        ->on('e.section_id', '=', 'ta.section_id')
                        ->where('e.status', '=', 'enrolled');
                })
                ->leftJoin('enrollment_courses as ec', function ($join) {
                    $join->on('ec.enrollment_id', '=', 'e.id')
                        ->on('ec.course_id', '=', 'ta.course_id')
                        ->whereIn('ec.status', ['active', 'inc', 'passed', 'failed']);
                })
                ->whereIn('ta.id', $assignmentIds)
                ->groupBy('ta.id')
                ->selectRaw('
                    ta.id as assignment_id,
                    COUNT(ec.id) as total_students,
                    SUM(CASE WHEN ec.final_grade IS NOT NULL THEN 1 ELSE 0 END) as graded_count,
                    SUM(CASE WHEN ec.status = "inc" OR ec.final_grade IS NULL THEN 1 ELSE 0 END) as pending_count,
                    SUM(CASE WHEN ec.status = "passed" THEN 1 ELSE 0 END) as passed_count,
                    SUM(CASE WHEN ec.status = "failed" THEN 1 ELSE 0 END) as failed_count
                ')
                ->get()
                ->keyBy('assignment_id');

        $paginator->setCollection(
            $paginator->getCollection()->map(function ($assignment) use ($metrics) {
                $metric = $metrics->get($assignment->id);
                $totalStudents = (int) ($metric->total_students ?? 0);
                $gradedCount = (int) ($metric->graded_count ?? 0);

                $assignment->grading_metrics = [
                    'total_students' => $totalStudents,
                    'graded_count' => $gradedCount,
                    'pending_count' => (int) ($metric->pending_count ?? 0),
                    'passed_count' => (int) ($metric->passed_count ?? 0),
                    'failed_count' => (int) ($metric->failed_count ?? 0),
                    'completion_rate' => $totalStudents > 0
                        ? round(($gradedCount / $totalStudents) * 100, 1)
                        : 0,
                ];

                return $assignment;
            })
        );

        return $paginator;
    }
}
