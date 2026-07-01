<?php

namespace Database\Seeders\Support;

use Illuminate\Support\Str;

/**
 * Student archetypes drive how AcademicHistorySeeder builds each transcript.
 * The archetype is persisted on students.remarks (human-readable) and re-derived
 * from it, so UserSeeder and AcademicHistorySeeder stay decoupled.
 *
 * Accuracy invariants (enforced by the history seeder):
 *  - No INC / failed / dropped is ever placed on a MAJOR or any prerequisite-bearing subject.
 *  - Upper-year students never carry an unresolved INC/dropped on a major.
 */
class StudentArchetype
{
    public const REGULAR     = 'regular';      // passed everything per curriculum, clean
    public const IRREGULAR   = 'irregular';    // dropped 1-2 lower-year minor subjects, not yet retaken
    public const TRANSFEREE  = 'transferee';   // first-year coursework credited (no grade)
    public const INC_CARRIER = 'inc_carrier';  // carrying an INC in a recent minor subject
    public const RECOVERED   = 'recovered';    // failed an early minor subject, retook and passed it

    private const REMARKS = [
        self::TRANSFEREE  => 'Transferee — prior coursework credited',
        self::RECOVERED   => 'Retook and passed an early minor subject',
        self::IRREGULAR   => 'Irregular — pending lower-year minor subjects',
        self::INC_CARRIER => 'Carrying an INC in a minor subject',
        self::REGULAR     => null,
    ];

    public static function remarkFor(string $archetype): ?string
    {
        return self::REMARKS[$archetype] ?? null;
    }

    public static function fromRemarks(?string $remarks): string
    {
        if ($remarks === null || $remarks === '') {
            return self::REGULAR;
        }
        if (Str::contains($remarks, 'Transferee')) {
            return self::TRANSFEREE;
        }
        if (Str::contains($remarks, 'Retook')) {
            return self::RECOVERED;
        }
        if (Str::contains($remarks, 'Irregular')) {
            return self::IRREGULAR;
        }
        if (Str::contains($remarks, 'INC')) {
            return self::INC_CARRIER;
        }

        return self::REGULAR;
    }

    /**
     * Deterministically assign an archetype to a student by its position within its
     * (program, year-level) cohort. Transferees/recovered only exist from 2nd year up
     * (they need prior-year history to credit / retake).
     */
    public static function assign(int $yearLevel, int $indexInGroup, int $groupSize): string
    {
        $transferee = $yearLevel >= 2 ? max(1, (int) round($groupSize * 0.12)) : 0;
        $recovered  = $yearLevel >= 2 ? max(1, (int) round($groupSize * 0.10)) : 0;
        $irregular  = max(1, (int) round($groupSize * 0.15));
        $incCarrier = max(1, (int) round($groupSize * 0.10));

        $cursor = 0;
        if ($indexInGroup < ($cursor += $transferee)) {
            return self::TRANSFEREE;
        }
        if ($indexInGroup < ($cursor += $recovered)) {
            return self::RECOVERED;
        }
        if ($indexInGroup < ($cursor += $irregular)) {
            return self::IRREGULAR;
        }
        if ($indexInGroup < ($cursor += $incCarrier)) {
            return self::INC_CARRIER;
        }

        return self::REGULAR;
    }
}
