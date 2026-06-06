<?php

namespace App\Services;

use App\Models\TeacherAssignment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
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
            ->when($filters['program_id'] ?? null, fn ($builder, $programId) => $builder->whereHas('section', fn ($q) => $q->where('program_id', $programId)))
            ->when($filters['year_level'] ?? null, fn ($builder, $yearLevel) => $builder->whereHas('section', fn ($q) => $q->where('year_level', $yearLevel)))
            ->when($scopedProgramIds !== null, fn ($builder) => $builder->whereHas('section', fn ($q) => $q->whereIn('program_id', $scopedProgramIds)))
            ->orderByDesc('academic_term_id')
            ->orderBy('section_id')
            ->orderBy('course_id');

        $paginator = $query->paginate(10)->withQueryString();

        $metricsMap = $this->metricsForAssignments($paginator->pluck('id')->all());

        $paginator->setCollection(
            $paginator->getCollection()->map(function ($assignment) use ($metricsMap) {
                $assignment->grading_metrics = $metricsMap->get($assignment->id) ?? $this->emptyMetrics();
                return $assignment;
            })
        );

        return $paginator;
    }

    /**
     * Fetch grading metrics for a given set of teacher assignment IDs.
     * Returned as a collection keyed by assignment_id, each value being a metrics array.
     *
     * Counts:
     *   total_students — enrolled students whose ec status is gradable (active/inc/passed/failed)
     *   graded_count   — rows where a final_grade has been submitted
     *   pending_count  — active rows with no grade yet (not yet touched by teacher)
     *   inc_count      — rows teacher explicitly marked as INC
     *   failed_count   — rows with status=failed
     *   dropped_count  — rows teacher marked as dropped
     *   completion_rate — graded / total * 100
     */
    public function metricsForAssignments(array $assignmentIds): Collection
    {
        if (empty($assignmentIds)) {
            return collect();
        }

        return DB::table('teacher_assignments as ta')
            ->leftJoin('enrollments as e', function ($join) {
                $join->on('e.academic_term_id', '=', 'ta.academic_term_id')
                    ->on('e.section_id', '=', 'ta.section_id');
            })
            ->leftJoin('enrollment_courses as ec', function ($join) {
                $join->on('ec.enrollment_id', '=', 'e.id')
                    ->on('ec.course_id', '=', 'ta.course_id')
                    ->whereIn('ec.status', ['active', 'inc', 'passed', 'failed', 'dropped']);
            })
            ->whereIn('ta.id', $assignmentIds)
            ->groupBy('ta.id')
            ->selectRaw('
                ta.id                                                                         AS assignment_id,
                SUM(CASE WHEN ec.status IN ("active","inc","passed","failed") THEN 1 ELSE 0 END) AS total_students,
                SUM(CASE WHEN ec.final_grade IS NOT NULL                      THEN 1 ELSE 0 END) AS graded_count,
                SUM(CASE WHEN ec.status = "active" AND ec.final_grade IS NULL THEN 1 ELSE 0 END) AS pending_count,
                SUM(CASE WHEN ec.status = "inc"                               THEN 1 ELSE 0 END) AS inc_count,
                SUM(CASE WHEN ec.status = "failed"                            THEN 1 ELSE 0 END) AS failed_count,
                SUM(CASE WHEN ec.status = "dropped"                           THEN 1 ELSE 0 END) AS dropped_count
            ')
            ->get()
            ->keyBy('assignment_id')
            ->map(function ($row) {
                $total  = (int) ($row->total_students ?? 0);
                $graded = (int) ($row->graded_count   ?? 0);

                return [
                    'total_students'  => $total,
                    'graded_count'    => $graded,
                    'pending_count'   => (int) ($row->pending_count ?? 0),
                    'inc_count'       => (int) ($row->inc_count     ?? 0),
                    'failed_count'    => (int) ($row->failed_count  ?? 0),
                    'dropped_count'   => (int) ($row->dropped_count ?? 0),
                    'completion_rate' => $total > 0 ? round(($graded / $total) * 100, 1) : 0,
                ];
            });
    }

    public function emptyMetrics(): array
    {
        return [
            'total_students'  => 0,
            'graded_count'    => 0,
            'pending_count'   => 0,
            'inc_count'       => 0,
            'failed_count'    => 0,
            'dropped_count'   => 0,
            'completion_rate' => 0,
        ];
    }
}
