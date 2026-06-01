<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Program;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CurriculumSeeder extends Seeder
{
    private const PROGRAM_DOCS = [
        'BSIT' => 'docs/curriculum/bsit.md',
        'BSCE' => 'docs/curriculum/bsce.md',
    ];

    private const YEAR_LEVELS = [
        'First Year' => 1,
        'Second Year' => 2,
        'Third Year' => 3,
        'Fourth Year' => 4,
    ];

    private const SEMESTERS = [
        'First Semester' => 'first',
        'Second Semester' => 'second',
        'Summer' => 'summer',
    ];

    public function run(): void
    {
        DB::disableQueryLog();

        foreach (self::PROGRAM_DOCS as $programCode => $documentPath) {
            $program = Program::where('code', $programCode)->firstOrFail();
            $this->seedProgram($program, $this->readCurriculum(base_path($documentPath)));
        }
    }

    private function readCurriculum(string $path): array
    {
        if (! file_exists($path)) {
            throw new RuntimeException("Curriculum file not found: {$path}");
        }

        $courses = [];
        $yearLevel = null;
        $semesterType = null;

        foreach (file($path, FILE_IGNORE_NEW_LINES) as $line) {
            $line = trim($line);

            if (str_starts_with($line, '## ')) {
                $yearLabel = trim(substr($line, 3));
                $yearLevel = self::YEAR_LEVELS[$yearLabel] ?? null;
                continue;
            }

            if (str_starts_with($line, '### ')) {
                $semesterLabel = trim(substr($line, 4));
                $semesterType = self::SEMESTERS[$semesterLabel] ?? null;
                continue;
            }

            if (! $yearLevel || ! $semesterType || ! str_starts_with($line, '|')) {
                continue;
            }

            $columns = array_map('trim', explode('|', trim($line, '|')));

            if (count($columns) < 7 || $columns[0] === 'Course Code' || str_starts_with($columns[0], '---')) {
                continue;
            }

            $courses[] = [
                'course_code' => $columns[0],
                'title' => $columns[1],
                'units' => (int) $columns[2],
                'lec_hours' => (int) $columns[3],
                'lab_hours' => (int) $columns[4],
                'year_level' => $yearLevel,
                'semester_type' => $semesterType,
                'co_requisites' => $this->courseCodesFromCell($columns[5]),
                'prerequisites' => $this->courseCodesFromCell($columns[6]),
            ];
        }

        return $courses;
    }

    private function courseCodesFromCell(string $cell): array
    {
        $normalized = trim(str_replace(['—', '–', 'â€”'], '', $cell));

        if ($normalized === '' || str_contains(strtolower($normalized), 'standing') || str_contains(strtolower($normalized), 'completed')) {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $normalized))));
    }

    private function seedProgram(Program $program, array $coursesData): void
    {
        foreach ($coursesData as $data) {
            Course::updateOrCreate(
                [
                    'program_id' => $program->id,
                    'course_code' => $data['course_code'],
                    'title' => $data['title'],
                ],
                [
                    'units' => $data['units'],
                    'lec_hours' => $data['lec_hours'],
                    'lab_hours' => $data['lab_hours'],
                    'year_level' => $data['year_level'],
                    'semester_type' => $data['semester_type'],
                    'is_active' => true,
                ]
            );
        }

        $courseMap = Course::where('program_id', $program->id)
            ->orderBy('year_level')
            ->orderByRaw("FIELD(semester_type, 'first', 'second', 'summer')")
            ->orderBy('id')
            ->get(['id', 'course_code', 'title'])
            ->groupBy('course_code');

        DB::table('course_prerequisites')
            ->whereIn(
                'course_id',
                Course::where('program_id', $program->id)->pluck('id')
            )
            ->delete();

        foreach ($coursesData as $data) {
            $course = Course::where('program_id', $program->id)
                ->where('course_code', $data['course_code'])
                ->where('title', $data['title'])
                ->first();

            if (! $course) {
                continue;
            }

            $this->insertRequirements($course->id, $courseMap, $data['prerequisites'], 'prerequisite');
            $this->insertRequirements($course->id, $courseMap, $data['co_requisites'], 'co_requisite');
        }
    }

    private function insertRequirements(int $courseId, $courseMap, array $courseCodes, string $type): void
    {
        foreach ($courseCodes as $courseCode) {
            $requirement = $courseMap->get($courseCode)?->first();

            if (! $requirement) {
                continue;
            }

            DB::table('course_prerequisites')->updateOrInsert(
                [
                    'course_id' => $courseId,
                    'prerequisite_id' => $requirement->id,
                    'type' => $type,
                ],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
