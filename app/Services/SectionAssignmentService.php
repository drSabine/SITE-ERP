<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Section;
use Illuminate\Validation\ValidationException;

class SectionAssignmentService
{
    public function bulkAssignStudentsToSection(Section $section, int $academicTermId, array $enrollmentIds): int
    {
        $updated = Enrollment::where('academic_term_id', $academicTermId)
            ->whereIn('id', $enrollmentIds)
            ->where('program_id', $section->program_id)
            ->where('year_level', $section->year_level)
            ->where('status', 'enrolled')
            ->update(['section_id' => $section->id]);

        return $updated;
    }

    public function validateCourseFitsSection(Section $section, int $courseId): void
    {
        $course = Course::active()
            ->where('id', $courseId)
            ->where('program_id', $section->program_id)
            ->where('year_level', $section->year_level)
            ->first();

        if (! $course) {
            throw ValidationException::withMessages([
                'course_id' => 'Selected subject is not offered for this section year level.',
            ]);
        }
    }

    public function validateYearLevelByProgram(string $programCode, int $yearLevel): void
    {
        $maxYearLevel = $programCode === 'BSCE' ? 5 : 4;

        if ($yearLevel < 1 || $yearLevel > $maxYearLevel) {
            throw ValidationException::withMessages([
                'year_level' => "Year level {$yearLevel} is not allowed for {$programCode}.",
            ]);
        }
    }
}
