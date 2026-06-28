<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use App\Models\UserProfile;
use App\Services\ActivityLogService;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(private ActivityLogService $activityLogs) {}

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
            'role' => 'nullable|in:admin,coordinator_it,coordinator_engineering,teacher,student',
            'status' => 'nullable|in:active,inactive',
        ]);

        $search = trim((string) $request->input('search', ''));
        $role = (string) $request->input('role', '');
        $status = (string) $request->input('status', 'active');

        $usersQuery = User::with([
            'userProfile' => fn($query) => $query
                ->withTrashed()
                ->select('id', 'user_id', 'first_name', 'middle_name', 'last_name', 'suffix', 'degree', 'specialization'),
            'student' => fn($query) => $query
                ->select('id', 'user_id', 'program_id', 'year_level', 'sex'),
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
            'users'    => $users,
            'filters'  => ['search' => $search, 'role' => $role, 'status' => $status],
            'programs' => Program::active()->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->mergeGeneratedIdentity($request);

        $isStudent = $request->input('role') === 'student';

        $data = $request->validate([
            'name'           => 'required|string|max:191',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|string|min:8|confirmed',
            'role'           => 'required|in:admin,coordinator_it,coordinator_engineering,teacher,student',
            'first_name'     => 'required|string|max:100',
            'middle_name'    => 'nullable|string|max:100',
            'last_name'      => 'required|string|max:100',
            'suffix'         => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:191',
            'degree'         => 'nullable|string|max:191',
            // Student-specific fields — required only when role = student
            'program_id'     => $isStudent ? 'required|exists:programs,id' : 'nullable',
            'year_level'     => $isStudent ? 'required|integer|min:1|max:4' : 'nullable',
            'sex'            => $isStudent ? 'required|in:Male,Female' : 'nullable',
        ]);

        $createdUser = DB::transaction(function () use ($data, $isStudent) {
            $user = User::create([
                'name'      => $data['name'],
                'email'     => $data['email'],
                'password'  => Hash::make($data['password']),
                'role'      => $data['role'],
                'is_active' => true,
            ]);

            $this->upsertUserProfile($user, $data);

            if ($isStudent) {
                Student::create([
                    'user_id'    => $user->id,
                    'first_name' => $data['first_name'],
                    'middle_name' => $data['middle_name'] ?? null,
                    'last_name'  => $data['last_name'],
                    'suffix'     => $data['suffix'] ?? null,
                    'sex'        => $data['sex'],
                    'email'      => $data['email'],
                    'program_id' => $data['program_id'],
                    'year_level' => $data['year_level'],
                    'status'     => 'active',
                ]);
            }

            return $user;
        });

        $this->activityLogs->record(
            $request,
            'created',
            'User Management',
            "Created user account for {$createdUser->name}.",
            $createdUser,
            ['role' => $createdUser->role]
        );

        return back();
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->mergeGeneratedIdentity($request, $user);

        // Role is immutable after creation — an admin/coordinator/teacher/student keeps its role.
        $isStudent = $user->role === 'student';

        $data = $request->validate([
            'name'           => 'required|string|max:191',
            'email'          => 'required|email|unique:users,email,' . $user->id,
            'is_active'      => 'boolean',
            'first_name'     => 'required|string|max:100',
            'middle_name'    => 'nullable|string|max:100',
            'last_name'      => 'required|string|max:100',
            'suffix'         => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:191',
            'degree'         => 'nullable|string|max:191',
            'password'       => 'nullable|string|min:8|confirmed',
            // Student-specific fields — required only when role = student
            'program_id'     => $isStudent ? 'required|exists:programs,id' : 'nullable',
            'year_level'     => $isStudent ? 'required|integer|min:1|max:4' : 'nullable',
            'sex'            => $isStudent ? 'required|in:Male,Female' : 'nullable',
        ]);

        $before = $user->only(['name', 'email', 'role', 'is_active']);

        DB::transaction(function () use ($user, $data, $isStudent) {
            $userUpdate = [
                'name'      => $data['name'],
                'email'     => $data['email'],
                'role'      => $user->role, // immutable
                'is_active' => $data['is_active'] ?? true,
            ];

            if (!empty($data['password'])) {
                $userUpdate['password'] = Hash::make($data['password']);
            }

            $user->update($userUpdate);
            $this->upsertUserProfile($user, $data);

            if ($isStudent) {
                $student = Student::withTrashed()->firstOrNew(['user_id' => $user->id]);

                if ($student->exists && $student->trashed()) {
                    $student->restore();
                }

                $student->fill([
                    'first_name'  => $data['first_name'],
                    'middle_name' => $data['middle_name'] ?? null,
                    'last_name'   => $data['last_name'],
                    'suffix'      => $data['suffix'] ?? null,
                    'sex'         => $data['sex'],
                    'email'       => $data['email'],
                    'program_id'  => $data['program_id'],
                    'year_level'  => $data['year_level'],
                    'status'      => 'active',
                ]);
                $student->user_id = $user->id;
                $student->save();
            }
        });

        $user->refresh();

        $this->activityLogs->record(
            $request,
            'updated',
            'User Management',
            "Updated user account for {$user->name}.",
            $user,
            [
                'before' => $before,
                'after' => $user->only(['name', 'email', 'role', 'is_active']),
            ]
        );

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_if($user->id === auth()->id(), 403, 'Cannot deactivate your own account.');

        $user->update(['is_active' => false]);

        $this->activityLogs->record(
            $request,
            'deactivated',
            'User Management',
            "Deactivated user account for {$user->name}.",
            $user
        );

        return back();
    }

    public function reactivate(Request $request, User $user): RedirectResponse
    {
        UserProfile::withTrashed()->where('user_id', $user->id)->restore();
        $user->update(['is_active' => true]);

        $this->activityLogs->record(
            $request,
            'reactivated',
            'User Management',
            "Reactivated user account for {$user->name}.",
            $user
        );

        return back();
    }
}
