<?php

namespace App\Services;

use App\Models\AcademicTerm;
use App\Models\SchoolYear;
use App\Models\TermPeriod;
use Illuminate\Validation\ValidationException;

class SchoolYearService
{
    /**
     * Create a school year with two default academic terms (1st and 2nd semester).
     * Summer is created on demand by the admin.
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

        foreach (['first', 'second'] as $semester) {
            $term = $schoolYear->academicTerms()->create([
                'semester'  => $semester,
                'is_active' => false,
            ]);

            foreach (['preliminary', 'midterm', 'finals'] as $period) {
                $term->termPeriods()->create([
                    'period'    => $period,
                    'is_active' => false,
                ]);
            }
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
     * Finalize a school year (locks it from further changes).
     */
    public function finalize(SchoolYear $schoolYear): void
    {
        $schoolYear->update(['status' => 'finalized', 'is_active' => false]);
    }

    /**
     * Create a summer term for a school year (optional, on demand).
     */
    public function createSummerTerm(SchoolYear $schoolYear): AcademicTerm
    {
        if ($schoolYear->academicTerms()->where('semester', 'summer')->exists()) {
            throw ValidationException::withMessages([
                'semester' => 'A summer term already exists for this school year.',
            ]);
        }

        $term = $schoolYear->academicTerms()->create([
            'semester'  => 'summer',
            'is_active' => false,
        ]);

        foreach (['preliminary', 'midterm', 'finals'] as $period) {
            $term->termPeriods()->create([
                'period'    => $period,
                'is_active' => false,
            ]);
        }

        return $term;
    }

    /**
     * Activate a specific academic term. Only one term per school year is active at a time.
     */
    public function activateTerm(AcademicTerm $term): void
    {
        AcademicTerm::where('school_year_id', $term->school_year_id)
            ->where('id', '!=', $term->id)
            ->update(['is_active' => false]);

        $term->update(['is_active' => true]);
    }

    /**
     * Activate a specific term period. Only one period per academic term is active at a time.
     */
    public function activatePeriod(TermPeriod $period): void
    {
        TermPeriod::where('academic_term_id', $period->academic_term_id)
            ->where('id', '!=', $period->id)
            ->update(['is_active' => false]);

        $period->update(['is_active' => true]);
    }

    /**
     * Deactivate a term period (close it for grade entry).
     */
    public function deactivatePeriod(TermPeriod $period): void
    {
        $period->update(['is_active' => false]);
    }
}
