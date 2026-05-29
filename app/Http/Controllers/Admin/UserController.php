<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserProfile;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    private function mergeGeneratedIdentity(Request $request, ?User $user = null): void
    {
        $request->merge([
            'name' => UserService::buildDisplayName(
                $request->string('first_name')->toString(),
                $request->filled('middle_name') ? $request->string('middle_name')->toString() : null,
                $request->string('last_name')->toString(),
                $request->filled('suffix') ? $request->string('suffix')->toString() : null
            ),
            'email' => UserService::generateEmail(
                $request->string('first_name')->toString(),
                $request->string('last_name')->toString(),
                $user?->id
            ),
        ]);
    }

    private function upsertUserProfile(User $user, array $data): void
    {
        $userProfile = UserProfile::withTrashed()->firstOrNew(['user_id' => $user->id]);

        if ($userProfile->exists && $userProfile->trashed()) {
            $userProfile->restore();
        }

        $userProfile->fill([
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'suffix' => $data['suffix'] ?? null,
            'specialization' => $data['specialization'] ?? null,
            'degree' => $data['degree'] ?? null,
        ]);
        $userProfile->user_id = $user->id;
        $userProfile->save();
    }

    public function index(Request $request): Response
    {
        $request->validate([
            'search' => 'nullable|string|max:100',
            'role' => 'nullable|in:admin,coordinator,teacher,student',
            'status' => 'nullable|in:active,inactive',
        ]);

        $search = trim((string) $request->input('search', ''));
        $role = (string) $request->input('role', '');
        $status = (string) $request->input('status', 'active');

        $usersQuery = User::with([
            'userProfile' => fn($query) => $query
                ->withTrashed()
                ->select('id', 'user_id', 'first_name', 'middle_name', 'last_name', 'suffix', 'degree', 'specialization'),
        ])->select('id', 'name', 'email', 'role', 'is_active');

        if ($status === 'inactive') {
            $usersQuery->where('is_active', false);
        } else {
            $usersQuery->active();
        }

        if ($role !== '') {
            $usersQuery->where('role', $role);
        }

        if ($search !== '') {
            $usersQuery->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhereHas('userProfile', function ($userProfileQuery) use ($search) {
                        $userProfileQuery->withTrashed()
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        $users = $usersQuery->paginate(10)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => ['search' => $search, 'role' => $role, 'status' => $status],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->mergeGeneratedIdentity($request);

        $data = $request->validate([
            'name' => 'required|string|max:191',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:admin,coordinator,teacher,student',
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'required|string|max:100',
            'suffix' => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:191',
            'degree' => 'nullable|string|max:191',
        ]);

        DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
                'is_active' => true,
            ]);

            $this->upsertUserProfile($user, $data);
        });

        return back();
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->mergeGeneratedIdentity($request, $user);

        $data = $request->validate([
            'name' => 'required|string|max:191',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role' => 'required|in:admin,coordinator,teacher,student',
            'is_active' => 'boolean',
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'required|string|max:100',
            'suffix' => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:191',
            'degree' => 'nullable|string|max:191',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        DB::transaction(function () use ($user, $data) {
            $userUpdate = [
                'name' => $data['name'],
                'email' => $data['email'],
                'role' => $data['role'],
                'is_active' => $data['is_active'] ?? true,
            ];

            if (!empty($data['password'])) {
                $userUpdate['password'] = Hash::make($data['password']);
            }

            $user->update($userUpdate);
            $this->upsertUserProfile($user, $data);
        });

        return back();
    }

    public function destroy(User $user): RedirectResponse
    {
        abort_if($user->id === auth()->id(), 403, 'Cannot deactivate your own account.');

        $user->update(['is_active' => false]);

        return back();
    }

    public function reactivate(User $user): RedirectResponse
    {
        UserProfile::withTrashed()->where('user_id', $user->id)->restore();
        $user->update(['is_active' => true]);

        return back();
    }
}
