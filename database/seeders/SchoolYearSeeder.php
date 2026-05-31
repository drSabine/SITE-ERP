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
                'semester' => 'first',
                'start_date' => '2025-08-01',
                'end_date' => '2025-12-20',
                'is_active' => false,
            ],
            [
                'semester' => 'second',
                'start_date' => '2026-01-05',
                'end_date' => '2026-05-31',
                'is_active' => true,
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
    }
}
