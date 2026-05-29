<?php

namespace Database\Seeders;

use App\Models\Program;
use Illuminate\Database\Seeder;

class ProgramSeeder extends Seeder
{
    public function run(): void
    {
        $programs = [
            [
                'code'      => 'BSIT',
                'name'      => 'Bachelor of Science in Information Technology',
                'is_active' => true,
            ],
            [
                'code'      => 'BSCE',
                'name'      => 'Bachelor of Science in Civil Engineering',
                'is_active' => true,
            ],
        ];

        foreach ($programs as $program) {
            Program::firstOrCreate(['code' => $program['code']], $program);
        }
    }
}
