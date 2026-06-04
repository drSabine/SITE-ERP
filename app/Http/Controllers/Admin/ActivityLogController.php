<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function __construct(private ActivityLogService $activityLogs) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => 'nullable|string|max:100',
            'module' => 'nullable|string|max:80',
            'action' => 'nullable|string|max:50',
        ]);

        $filters = [
            'search' => trim((string) ($filters['search'] ?? '')),
            'module' => (string) ($filters['module'] ?? ''),
            'action' => (string) ($filters['action'] ?? ''),
        ];

        return Inertia::render('Admin/ActivityLogs/Index', [
            'activityLogs' => $this->activityLogs->listForAdmin($filters),
            'filters' => $filters,
            'filterOptions' => $this->activityLogs->filterOptions(),
        ]);
    }
}
