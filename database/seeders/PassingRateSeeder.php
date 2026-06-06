<?php

namespace Database\Seeders;

use App\Models\PassingRate;
use App\Models\Program;
use Illuminate\Database\Seeder;

class PassingRateSeeder extends Seeder
{
    public function run(): void
    {
        $bsce   = Program::where('code', 'BSCE')->first();
        $bsense = Program::where('code', 'BSENSE')->first();

        if (! $bsce || ! $bsense) {
            return;
        }

        // One record per program per national board exam period (May and November each year).
        // Figures represent overall passers out of total takers for that exam period.
        $records = [
            // BSCE — Civil Engineering Board Exam
            ['program_id' => $bsce->id,   'exam_month' => 5,  'exam_year' => 2022, 'total_takers' => 20, 'passers_count' => 13],
            ['program_id' => $bsce->id,   'exam_month' => 11, 'exam_year' => 2022, 'total_takers' => 16, 'passers_count' => 10],
            ['program_id' => $bsce->id,   'exam_month' => 5,  'exam_year' => 2023, 'total_takers' => 22, 'passers_count' => 16],
            ['program_id' => $bsce->id,   'exam_month' => 11, 'exam_year' => 2023, 'total_takers' => 18, 'passers_count' => 13],
            ['program_id' => $bsce->id,   'exam_month' => 5,  'exam_year' => 2024, 'total_takers' => 25, 'passers_count' => 20],
            ['program_id' => $bsce->id,   'exam_month' => 11, 'exam_year' => 2024, 'total_takers' => 20, 'passers_count' => 15],
            ['program_id' => $bsce->id,   'exam_month' => 5,  'exam_year' => 2025, 'total_takers' => 23, 'passers_count' => 19],

            // BSENSE — Environmental & Sanitary Engineering Board Exam
            ['program_id' => $bsense->id, 'exam_month' => 5,  'exam_year' => 2022, 'total_takers' => 12, 'passers_count' => 8],
            ['program_id' => $bsense->id, 'exam_month' => 11, 'exam_year' => 2022, 'total_takers' => 9,  'passers_count' => 6],
            ['program_id' => $bsense->id, 'exam_month' => 5,  'exam_year' => 2023, 'total_takers' => 14, 'passers_count' => 10],
            ['program_id' => $bsense->id, 'exam_month' => 11, 'exam_year' => 2023, 'total_takers' => 10, 'passers_count' => 7],
            ['program_id' => $bsense->id, 'exam_month' => 5,  'exam_year' => 2024, 'total_takers' => 16, 'passers_count' => 13],
            ['program_id' => $bsense->id, 'exam_month' => 11, 'exam_year' => 2024, 'total_takers' => 12, 'passers_count' => 10],
            ['program_id' => $bsense->id, 'exam_month' => 5,  'exam_year' => 2025, 'total_takers' => 15, 'passers_count' => 13],
        ];

        foreach ($records as $record) {
            PassingRate::firstOrCreate(
                [
                    'program_id' => $record['program_id'],
                    'exam_month' => $record['exam_month'],
                    'exam_year'  => $record['exam_year'],
                ],
                $record
            );
        }
    }
}
