<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\StaffProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Users/Index', [
            'users' => User::with(['staffProfile' => fn($q) => $q->select(
                'user_id', 'employee_id', 'first_name', 'last_name', 'specialization'
            )])
            ->where('id', '!=', auth()->id())
            ->paginate(15)
            ->withQueryString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:191',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|string|min:8',
            'role'           => 'required|in:admin,coordinator,teacher',
            'employee_id'    => 'required|string|max:50|unique:staff_profiles,employee_id',
            'first_name'     => 'required|string|max:100',
            'middle_name'    => 'nullable|string|max:100',
            'last_name'      => 'required|string|max:100',
            'suffix'         => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:191',
            'degree'         => 'nullable|string|max:191',
        ]);

        DB::transaction(function () use ($data) {
            $user = User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => Hash::make($data['password']),
                'role'     => $data['role'],
            ]);

            $user->staffProfile()->create([
                'employee_id'    => $data['employee_id'],
                'first_name'     => $data['first_name'],
                'middle_name'    => $data['middle_name'] ?? null,
                'last_name'      => $data['last_name'],
                'suffix'         => $data['suffix'] ?? null,
                'specialization' => $data['specialization'] ?? null,
                'degree'         => $data['degree'] ?? null,
            ]);
        });

        return back();
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:191',
            'email'          => 'required|email|unique:users,email,' . $user->id,
            'role'           => 'required|in:admin,coordinator,teacher',
            'is_active'      => 'boolean',
            'employee_id'    => 'required|string|max:50|unique:staff_profiles,employee_id,' . optional($user->staffProfile)->id,
            'first_name'     => 'required|string|max:100',
            'middle_name'    => 'nullable|string|max:100',
            'last_name'      => 'required|string|max:100',
            'suffix'         => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:191',
            'degree'         => 'nullable|string|max:191',
        ]);

        DB::transaction(function () use ($user, $data) {
            $user->update([
                'name'      => $data['name'],
                'email'     => $data['email'],
                'role'      => $data['role'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            $user->staffProfile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'employee_id'    => $data['employee_id'],
                    'first_name'     => $data['first_name'],
                    'middle_name'    => $data['middle_name'] ?? null,
                    'last_name'      => $data['last_name'],
                    'suffix'         => $data['suffix'] ?? null,
                    'specialization' => $data['specialization'] ?? null,
                    'degree'         => $data['degree'] ?? null,
                ]
            );
        });

        return back();
    }

    public function destroy(User $user): RedirectResponse
    {
        abort_if($user->id === auth()->id(), 403, 'Cannot delete your own account.');

        $user->staffProfile?->delete();
        $user->update(['is_active' => false]);

        return back();
    }
}
