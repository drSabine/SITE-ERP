<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\SubmissionCategory;
use App\Services\ActivityLogService;
use App\Services\DocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VerificationController extends Controller
{
    public function __construct(
        private readonly DocumentService $documents,
        private readonly ActivityLogService $activityLogs,
    ) {}

    public function index(Request $request): Response
    {
        $request->validate([
            'category' => 'nullable|integer|exists:submission_categories,id',
            'search'   => 'nullable|string|max:100',
            'sort'     => 'nullable|in:category,deadline,recent',
        ]);

        $filters = [
            'category' => $request->input('category'),
            'search'   => trim((string) $request->input('search', '')),
            'sort'     => $request->input('sort', 'category'),
        ];

        return Inertia::render('Documents/Verify', [
            'documents'  => $this->documents->pendingQueue($filters),
            'categories' => SubmissionCategory::active()->ordered()->get(['id', 'code', 'name']),
            'filters'    => $filters,
        ]);
    }

    public function verify(Request $request, Document $document): RedirectResponse
    {
        $data = $request->validate([
            'action'  => 'required|in:approve,reject',
            'remarks' => 'nullable|string|max:1000',
        ]);

        if ($data['action'] === 'reject' && empty(trim((string) ($data['remarks'] ?? '')))) {
            return back()->withErrors(['remarks' => 'Remarks are required when rejecting a submission.']);
        }

        $this->documents->verify($request->user(), $document, $data['action'], $data['remarks'] ?? null);

        $this->activityLogs->record(
            $request,
            $data['action'] === 'approve' ? 'verified' : 'rejected',
            'Documents',
            ($data['action'] === 'approve' ? 'Verified' : 'Rejected') . " document {$document->title}.",
            $document,
            ['remarks' => $data['remarks'] ?? null]
        );

        return back()->with('success', 'Verification recorded.');
    }
}
