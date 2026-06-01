<?php

namespace App\Http\Middleware;

use App\Models\AcademicTerm;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $hasTeachingLoad = false;
        if ($user && in_array($user->role, ['admin', 'coordinator_it', 'coordinator_engineering', 'teacher'])) {
            $activeTerm = AcademicTerm::active()->first(['id']);
            if ($activeTerm) {
                $hasTeachingLoad = $user->teacherAssignments()
                    ->where('academic_term_id', $activeTerm->id)
                    ->exists();
            }
        }

        return [
            ...parent::share($request),
            'auth'            => ['user' => $user],
            'hasTeachingLoad' => $hasTeachingLoad,
            'appEnv'          => config('app.env'),
        ];
    }
}
