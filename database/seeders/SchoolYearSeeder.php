<?php

namespace Database\Seeders;

use App\Models\AcademicTerm;
use App\Models\SchoolYear;
use Illuminate\Database\Seeder;

class SchoolYearSeeder extends Seeder
{
    /**
     * Chronological school years. The first three are finalized history (drive trend
     * charts and per-student transcripts); 2025-2026 is the active year.
     * Order matters: AcademicHistorySeeder maps a student's year level onto these by index.
     */
    private const SCHOOL_YEARS = [
        '2022-2023' => ['start_date' => '2022-08-01', 'end_date' => '2023-05-31', 'active' => false],
        '2023-2024' => ['start_date' => '2023-08-01', 'end_date' => '2024-05-31', 'active' => false],
        '2024-2025' => ['start_date' => '2024-08-01', 'end_date' => '2025-05-31', 'active' => false],
        '2025-2026' => ['start_date' => '2025-08-01', 'end_date' => '2026-05-31', 'active' => true],
    ];

    public function run(): void
    {
        foreach (self::SCHOOL_YEARS as $name => $data) {
            $startYear = (int) substr($data['start_date'], 0, 4);
            $endYear   = (int) substr($data['end_date'], 0, 4);

            $schoolYear = SchoolYear::updateOrCreate(
                ['name' => $name],
                [
                    'start_date' => $data['start_date'],
                    'end_date'   => $data['end_date'],
                    'is_active'  => $data['active'],
                    'status'     => $data['active'] ? 'active' : 'finalized',
                ]
            );

            // The active year runs its 2nd semester; everything else is closed.
            $activeSemester = $data['active'] ? 'second' : null;

            foreach ([
                ['semester' => 'first',  'start_date' => "{$startYear}-08-01", 'end_date' => "{$startYear}-12-20"],
                ['semester' => 'second', 'start_date' => "{$endYear}-01-05",   'end_date' => "{$endYear}-05-31"],
                ['semester' => 'summer', 'start_date' => "{$endYear}-06-01",   'end_date' => "{$endYear}-07-31"],
            ] as $termData) {
                $schoolYear->academicTerms()->updateOrCreate(
                    ['semester' => $termData['semester']],
                    [...$termData, 'is_active' => $termData['semester'] === $activeSemester]
                );
            }
        }

        // Exactly one active school year + term across the whole table.
        $active = SchoolYear::where('name', '2025-2026')->first();
        SchoolYear::where('id', '!=', $active->id)->update(['is_active' => false]);
        AcademicTerm::where('school_year_id', '!=', $active->id)->update(['is_active' => false]);
        AcademicTerm::where('school_year_id', $active->id)
            ->where('semester', '!=', 'second')
            ->update(['is_active' => false]);
    }
}
