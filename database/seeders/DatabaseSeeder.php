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
            SchoolYearSeeder::class,
            UserSeeder::class,
            ProgramSeeder::class,
            CurriculumSeeder::class,
            SectionSeeder::class,
            EnrollmentSeeder::class,         // active term enrollments (2nd semester 2025-2026)
            SubmissionCategorySeeder::class,
            ComprehensiveGradeSeeder::class, // past years + teacher assignments + grades
            GraduateSeeder::class,           // alumni per past S.Y. (drives graduate analytics)
            GraduationCandidateSeeder::class, // ready-to-graduate students (visible candidates)
        ]);
    }
}
