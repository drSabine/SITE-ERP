<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Program;
use App\Models\Section;
use Illuminate\Database\Seeder;

class SectionSeeder extends Seeder
{
    public function run(): void
    {
        // Year levels are driven by each program's actual curriculum so five-year
        // programs (BSCE, BSENSE) get 5th-year sections and four-year programs do not.
        foreach (Program::where('is_active', true)->get() as $program) {
            $maxYearLevel = (int) Course::where('program_id', $program->id)->max('year_level') ?: 4;

            foreach (range(1, $maxYearLevel) as $yearLevel) {
                foreach (['A', 'B'] as $suffix) {
                    Section::updateOrCreate(
                        ['program_id' => $program->id, 'year_level' => $yearLevel, 'name' => "{$program->code}-{$yearLevel}{$suffix}"],
                        ['is_active' => true]
                    );
                }
            }
        }
    }
}
