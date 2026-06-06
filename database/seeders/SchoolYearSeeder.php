<?php

namespace Database\Seeders;

use App\Models\AcademicTerm;
use App\Models\SchoolYear;
use Illuminate\Database\Seeder;

class SchoolYearSeeder extends Seeder
{
    public function run(): void
    {
        $schoolYear = SchoolYear::updateOrCreate(
            ['name' => '2025-2026'],
            [
                'start_date' => '2025-08-01',
                'end_date' => '2026-05-31',
                'is_active' => true,
                'status' => 'active',
            ]
        );

        SchoolYear::where('id', '!=', $schoolYear->id)->update(['is_active' => false]);

        $terms = [
            [
                'semester'   => 'first',
                'start_date' => '2025-08-01',
                'end_date'   => '2025-12-20',
                'is_active'  => false,
            ],
            [
                'semester'   => 'second',
                'start_date' => '2026-01-05',
                'end_date'   => '2026-05-31',
                'is_active'  => true,
            ],
            [
                'semester'   => 'summer',
                'start_date' => null,
                'end_date'   => null,
                'is_active'  => false,
            ],
        ];

        foreach ($terms as $termData) {
            $schoolYear->academicTerms()->updateOrCreate(
                ['semester' => $termData['semester']],
                $termData
            );
        }

        AcademicTerm::where('school_year_id', $schoolYear->id)
            ->where('semester', '!=', 'second')
            ->update(['is_active' => false]);

        $this->ensureTermsForEverySchoolYear();
    }

    private function ensureTermsForEverySchoolYear(): void
    {
        SchoolYear::query()->get()->each(function (SchoolYear $schoolYear) {
            $startYear = $schoolYear->start_date?->format('Y') ?? substr($schoolYear->name, 0, 4);
            $endYear = $schoolYear->end_date?->format('Y') ?? substr($schoolYear->name, -4);

            foreach ([
                ['semester' => 'first', 'start_date' => "{$startYear}-08-01", 'end_date' => "{$startYear}-12-20"],
                ['semester' => 'second', 'start_date' => "{$endYear}-01-05", 'end_date' => "{$endYear}-05-31"],
                ['semester' => 'summer', 'start_date' => "{$endYear}-06-01", 'end_date' => "{$endYear}-07-31"],
            ] as $termData) {
                $schoolYear->academicTerms()->firstOrCreate(
                    ['semester' => $termData['semester']],
                    [...$termData, 'is_active' => false]
                );
            }
        });
    }
}
