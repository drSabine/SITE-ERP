<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            SchoolYearSeeder::class,          // 2022-2026 school years + terms (history + active)
            ProgramSeeder::class,             // all degree programs (must exist before users/curriculum)
            UserSeeder::class,                // staff + active students (bulk insert, archetype-tagged)
            CurriculumSeeder::class,
            SectionSeeder::class,
            AcademicHistorySeeder::class,     // full per-student transcripts + teaching loads
            SubmissionCategorySeeder::class,
            GraduateSeeder::class,            // alumni per past S.Y. (drives graduate analytics)
            GraduationCandidateSeeder::class, // ready-to-graduate students (visible candidates)
            BoardExamResultSeeder::class,     // engineering licensure passers (board-exam analytics)
        ]);
    }
}
