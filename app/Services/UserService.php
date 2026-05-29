<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;

class UserService
{
    public static function buildDisplayName(
        string $firstName,
        ?string $middleName,
        string $lastName,
        ?string $suffix = null
    ): string
    {
        $middleInitial = filled($middleName) ? ' ' . Str::upper(Str::substr($middleName, 0, 1)) . '.' : '';
        $suffixLabel = filled($suffix) ? ' ' . trim($suffix) : '';

        return trim(trim($firstName) . $middleInitial . ' ' . trim($lastName) . $suffixLabel);
    }

    /**
     * Format: firstname.lastname@site.spup
     */
    public static function buildEmail(string $firstName, string $lastName): string
    {
        $localPart = Str::lower(Str::ascii($firstName)) . '.' . Str::lower(Str::ascii($lastName));
        $localPart = preg_replace('/[^a-z0-9.]/', '', $localPart);

        return $localPart . '@site.spup';
    }

    /**
     * Generate a unique institutional email from a user's name.
     *
     * Duplicates: firstname.lastname1@site.spup, firstname.lastname2@site.spup, etc.
     */
    public static function generateEmail(string $firstName, string $lastName, ?int $ignoreUserId = null): string
    {
        $baseEmail = static::buildEmail($firstName, $lastName);

        if (! static::emailExists($baseEmail, $ignoreUserId)) {
            return $baseEmail;
        }

        $localPart = str($baseEmail)->before('@')->toString();
        $counter = 1;
        do {
            $candidateEmail = $localPart . $counter . '@site.spup';
            $counter++;
        } while (static::emailExists($candidateEmail, $ignoreUserId));

        return $candidateEmail;
    }

    private static function emailExists(string $email, ?int $ignoreUserId = null): bool
    {
        return User::query()
            ->where('email', $email)
            ->when($ignoreUserId, fn($query) => $query->where('id', '!=', $ignoreUserId))
            ->exists();
    }
}
