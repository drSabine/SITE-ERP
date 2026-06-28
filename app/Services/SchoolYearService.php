<?php

namespace App\Services;

use App\Models\AcademicTerm;
use App\Models\SchoolYear;
use Illuminate\Validation\ValidationException;

class SchoolYearService
{
    /**
     * Create a school year with first, second, and summer academic terms.
     */
    public function create(array $data): SchoolYear
    {
        $schoolYear = SchoolYear::create([
            'name'       => $data['name'],
            'start_date' => $data['start_date'],
            'end_date'   => $data['end_date'],
            'is_active'  => false,
            'status'     => 'active',
        ]);

        foreach (['first', 'second', 'summer'] as $semester) {
            $termData = ['semester' => $semester, 'is_active' => false];

            if ($semester === 'summer' && ! empty($data['summer_start_date'])) {
                $termData['start_date'] = $data['summer_start_date'];
                $termData['end_date']   = $data['summer_end_date'] ?? null;
            }

            $schoolYear->academicTerms()->create($termData);
        }

        return $schoolYear;
    }

    /**
     * Set a school year as active. Only one school year is active at a time.
     */
    public function activate(SchoolYear $schoolYear): void
    {
        SchoolYear::where('id', '!=', $schoolYear->id)->update(['is_active' => false]);
        $schoolYear->update(['is_active' => true]);
    }

    /**
     * Finalize a school year (lock it from further changes).
     */
    public function finalize(SchoolYear $schoolYear): void
    {
        $schoolYear->update(['status' => 'finalized', 'is_active' => false]);
    }

    /**
     * Activate a specific academic term.
     * Only one term across ALL school years is active at a time.
     * The owning school year becomes active with it so enrollment screens stay aligned.
     */
    public function activateTerm(AcademicTerm $term): void
    {
        $term->loadMissing('schoolYear');

        if ($term->schoolYear?->status === 'finalized') {
            throw ValidationException::withMessages([
                'term' => 'Cannot activate a term from a finalized school year.',
            ]);
        }

        SchoolYear::where('id', '!=', $term->school_year_id)->update(['is_active' => false]);
        $term->schoolYear?->update(['is_active' => true]);

        AcademicTerm::where('id', '!=', $term->id)->update(['is_active' => false]);
        $term->update(['is_active' => true]);
    }
}
