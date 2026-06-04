<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ActivityLogService
{
    public function record(
        Request $request,
        string $action,
        string $module,
        string $description,
        ?Model $subject = null,
        array $properties = []
    ): void {
        ActivityLog::create([
            'user_id'      => $request->user()?->id,
            'action'       => $action,
            'module'       => $module,
            'description'  => $description,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id'   => $subject?->getKey(),
            'ip_address'   => $request->ip(),
            'user_agent'   => $request->userAgent(),
            'properties'   => $properties !== [] ? $properties : null,
        ]);
    }

    public function listForAdmin(array $filters): LengthAwarePaginator
    {
        $query = ActivityLog::with([
            'user' => fn ($relation) => $relation->select('id', 'name', 'email', 'role'),
        ])->select([
            'id',
            'user_id',
            'action',
            'module',
            'description',
            'subject_type',
            'subject_id',
            'ip_address',
            'created_at',
        ]);

        if (($filters['module'] ?? '') !== '') {
            $query->where('module', $filters['module']);
        }

        if (($filters['action'] ?? '') !== '') {
            $query->where('action', $filters['action']);
        }

        if (($filters['search'] ?? '') !== '') {
            $search = $filters['search'];

            $query->where(function ($activityQuery) use ($search) {
                $activityQuery->where('description', 'like', "%{$search}%")
                    ->orWhere('module', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        return $query->latest()
            ->paginate(10)
            ->withQueryString();
    }

    public function filterOptions(): array
    {
        return [
            'modules' => ActivityLog::query()
                ->select('module')
                ->distinct()
                ->orderBy('module')
                ->pluck('module')
                ->all(),
            'actions' => ActivityLog::query()
                ->select('action')
                ->distinct()
                ->orderBy('action')
                ->pluck('action')
                ->all(),
        ];
    }
}
