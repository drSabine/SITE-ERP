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
            [
                'code'      => 'BSENSE',
                'name'      => 'Bachelor of Science in Environmental & Sanitary Engineering',
                'is_active' => true,
            ],
            [
                'code'      => 'BSCpE',
                'name'      => 'Bachelor of Science in Computer Engineering',
                'is_active' => true,
            ],
            [
                'code'      => 'BLIS',
                'name'      => 'Bachelor of Library and Information Science',
                'is_active' => true,
            ],
        ];

        foreach ($programs as $program) {
            Program::firstOrCreate(['code' => $program['code']], $program);
        }
    }
}
