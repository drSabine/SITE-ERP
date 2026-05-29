<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;

class UserService
{
    /**
     * Generate a unique institutional email from a user's name.
     *
     * Format: firstname.lastname@site.spup
     * Duplicates: firstname.lastname1@site.spup, firstname.lastname2@site.spup, etc.
     */
    public static function generateEmail(string $firstName, string $lastName): string
    {
        $localPart = Str::lower(Str::ascii($firstName)) . '.' . Str::lower(Str::ascii($lastName));
        $localPart = preg_replace('/[^a-z0-9.]/', '', $localPart);
        $domain    = 'site.spup';
        $baseEmail = $localPart . '@' . $domain;

        if (! User::where('email', $baseEmail)->exists()) {
            return $baseEmail;
        }

        $counter = 1;
        do {
            $candidateEmail = $localPart . $counter . '@' . $domain;
            $counter++;
        } while (User::where('email', $candidateEmail)->exists());

        return $candidateEmail;
    }
}
