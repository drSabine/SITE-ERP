<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\SchoolYear;
use App\Models\Student;
use Illuminate\Database\Seeder;

class GraduateSeeder extends Seeder
{
    // Graduates per past school year. A dip in 2024-2025 makes the "needed to grow"
    // (beat last year by 1) target visible on the admin chart.
    private const PLAN = [
        '2022-2023' => 45,
        '2023-2024' => 50,
        '2024-2025' => 48,
    ];

    public function run(): void
    {
        $bsit = Program::where('code', 'BSIT')->first();
        $bsce = Program::where('code', 'BSCE')->first();

        if (! $bsit || ! $bsce) {
            $this->command->warn('GraduateSeeder: BSIT/BSCE program missing. Skipping.');
            return;
        }

        $firstNames = ['Alyssa Mae', 'Bryan Carlo', 'Carla Joy', 'Daniel Jose', 'Elaine Rose',
            'Francis Mark', 'Hannah Grace', 'Ivan Carlo', 'Janine Marie', 'Kenneth Paul'];
        $middleNames = ['Bautista', 'Reyes', 'Santos', 'Mercado', 'Aquino', 'Rivera', 'Velasco', 'Padilla'];
        $lastNames = ['Alonzo', 'Bayani', 'Cuevas', 'Diaz', 'Enriquez', 'Fajardo', 'Gomez', 'Herrera',
            'Ibanez', 'Jacinto', 'Lazaro', 'Medina', 'Nieva', 'Oliveros', 'Peralta', 'Quirino'];

        foreach (self::PLAN as $schoolYearName => $count) {
            $schoolYear = SchoolYear::where('name', $schoolYearName)->first();
            if (! $schoolYear) {
                continue;
            }

            $endYear = substr($schoolYearName, 5, 4);
            $graduatedAt = "{$endYear}-05-31";

            for ($index = 0; $index < $count; $index++) {
                $program = $index % 2 === 0 ? $bsit : $bsce;

                Student::create([
                    'first_name'               => $firstNames[$index % count($firstNames)],
                    'middle_name'              => $middleNames[$index % count($middleNames)],
                    'last_name'                => $lastNames[$index % count($lastNames)],
                    'sex'                      => $index % 2 === 0 ? 'Female' : 'Male',
                    'program_id'               => $program->id,
                    'year_level'               => $program->code === 'BSCE' ? 5 : 4,
                    'status'                   => 'graduated',
                    'graduated_school_year_id' => $schoolYear->id,
                    'graduated_at'             => $graduatedAt,
                ]);
            }
        }

        $this->command->info('GraduateSeeder: seeded ' . array_sum(self::PLAN) . ' alumni across past school years.');
    }
}
