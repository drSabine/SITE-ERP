<?php

namespace Database\Seeders;

use App\Models\SubmissionCategory;
use Illuminate\Database\Seeder;

class SubmissionCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['code' => 'ISO',     'name' => 'ISO',     'description' => 'International Organization for Standardization compliance documents.'],
            ['code' => 'PAASCU',  'name' => 'PAASCU',  'description' => 'Philippine Accrediting Association of Schools, Colleges and Universities.'],
            ['code' => 'PQA',     'name' => 'PQA',     'description' => 'Philippine Quality Award submissions.'],
            ['code' => 'UNIWIDE', 'name' => 'Uniwide', 'description' => 'University-wide submissions and requirements.'],
            ['code' => 'PACCOA',  'name' => 'PACCOA',  'description' => 'Philippine Association of Colleges and Universities Commission on Accreditation.'],
            ['code' => 'CHED',    'name' => 'CHED',    'description' => 'Commission on Higher Education submissions.'],
            ['code' => 'TESDA',   'name' => 'TESDA',   'description' => 'Technical Education and Skills Development Authority submissions.'],
            ['code' => 'OTHERS',  'name' => 'Others',  'description' => 'Other departmental submissions.'],
        ];

        foreach ($categories as $category) {
            SubmissionCategory::updateOrCreate(
                ['code' => $category['code']],
                ['name' => $category['name'], 'description' => $category['description'], 'is_active' => true]
            );
        }
    }
}
