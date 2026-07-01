<?php

namespace Database\Seeders;

use App\Models\BoardExamResult;
use App\Models\Program;
use App\Models\User;
use Illuminate\Database\Seeder;

class BoardExamResultSeeder extends Seeder
{
    public function run(): void
    {
        $bsce   = Program::where('code', 'BSCE')->first();
        $bsense = Program::where('code', 'BSENSE')->first();

        if (! $bsce || ! $bsense) {
            $this->command->warn('BoardExamResultSeeder: engineering programs missing. Skipping.');
            return;
        }

        $recordedBy = User::where('role', 'coordinator_engineering')->value('id')
            ?? User::where('role', 'admin')->value('id');

        // Engineering licensure exams are offered twice a year: the March and the
        // September intakes. Every record uses month 3 or 9.
        // [program, exam_name, year, month, first_takers, first_passers, retakers, retaker_passers]
        $rows = [
            // Civil Engineer Licensure Exam — March (3) + September (9)
            [$bsce, 'Civil Engineer Licensure Exam', 2023, 3,  20, 13, 8,  3],
            [$bsce, 'Civil Engineer Licensure Exam', 2023, 9,  24, 17, 7,  3],
            [$bsce, 'Civil Engineer Licensure Exam', 2024, 3,  27, 20, 9,  4],
            [$bsce, 'Civil Engineer Licensure Exam', 2024, 9,  30, 24, 6,  3],
            [$bsce, 'Civil Engineer Licensure Exam', 2025, 3,  33, 27, 10, 6],
            [$bsce, 'Civil Engineer Licensure Exam', 2025, 9,  35, 29, 8,  5],

            // Sanitary Engineer Licensure Exam — March (3) + September (9)
            [$bsense, 'Sanitary Engineer Licensure Exam', 2023, 3,  9,  5,  4, 1],
            [$bsense, 'Sanitary Engineer Licensure Exam', 2023, 9,  11, 7,  3, 1],
            [$bsense, 'Sanitary Engineer Licensure Exam', 2024, 3,  12, 8,  4, 2],
            [$bsense, 'Sanitary Engineer Licensure Exam', 2024, 9,  13, 10, 3, 1],
            [$bsense, 'Sanitary Engineer Licensure Exam', 2025, 3,  15, 11, 5, 3],
            [$bsense, 'Sanitary Engineer Licensure Exam', 2025, 9,  16, 13, 4, 2],
        ];

        foreach ($rows as [$program, $name, $year, $month, $first, $firstPass, $retakers, $retakerPass]) {
            BoardExamResult::create([
                'program_id'          => $program->id,
                'exam_name'           => $name,
                'exam_year'           => $year,
                'exam_month'          => $month,
                'first_takers'        => $first,
                'first_taker_passers' => $firstPass,
                'retakers'            => $retakers,
                'retaker_passers'     => $retakerPass,
                'recorded_by'         => $recordedBy,
            ]);
        }
    }
}
