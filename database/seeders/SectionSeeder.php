<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\Section;
use Illuminate\Database\Seeder;

class SectionSeeder extends Seeder
{
    public function run(): void
    {
        $bsit = Program::where('code', 'BSIT')->first();
        $bsce = Program::where('code', 'BSCE')->first();

        if ($bsit) {
            foreach ([1, 2, 3, 4] as $yearLevel) {
                foreach (['A', 'B'] as $sectionSuffix) {
                    Section::updateOrCreate(
                        ['program_id' => $bsit->id, 'year_level' => $yearLevel, 'name' => "BSIT-{$yearLevel}{$sectionSuffix}"],
                        ['is_active' => true]
                    );
                }
            }
        }

        if ($bsce) {
            foreach ([1, 2, 3, 4, 5] as $yearLevel) {
                foreach (['A', 'B'] as $sectionSuffix) {
                    Section::updateOrCreate(
                        ['program_id' => $bsce->id, 'year_level' => $yearLevel, 'name' => "BSCE-{$yearLevel}{$sectionSuffix}"],
                        ['is_active' => true]
                    );
                }
            }
        }
    }
}
