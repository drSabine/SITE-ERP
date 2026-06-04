<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentFile;
use App\Models\SubmissionCategory;
use App\Services\ActivityLogService;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    /** Accepted upload types — office docs, PDFs and images, capped at 10 MB. */
    private const FILE_RULES = 'required|file|max:10240|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png';

    public function __construct(
        private readonly DocumentService $documents,
        private readonly ActivityLogService $activityLogs,
    ) {}

    public function index(Request $request): Response
    {
        $request->validate([
            'search'   => 'nullable|string|max:100',
            'category' => 'nullable|integer|exists:submission_categories,id',
            'status'   => 'nullable|in:pending,verified,rejected',
        ]);

        $filters = [
            'search'   => trim((string) $request->input('search', '')),
            'category' => $request->input('category'),
            'status'   => $request->input('status'),
        ];

        return Inertia::render('Documents/Index', [
            'documents'  => $this->documents->listFor($request->user(), $filters),
            'categories' => SubmissionCategory::active()->ordered()->get(['id', 'code', 'name']),
            'filters'    => $filters,
            'can'        => ['verify' => $this->isAdmin($request)],
        ]);
    }

    public function status(Request $request): Response
    {
        $overview = $this->documents->statusOverview($request->user());

        return Inertia::render('Documents/Status', [
            'summary'    => $overview['summary'],
            'categories' => $overview['categories'],
            'isAdmin'    => $this->isAdmin($request),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title'                  => 'required|string|max:191',
            'description'            => 'nullable|string|max:1000',
            'submission_category_id' => 'required|exists:submission_categories,id',
            'custom_category'        => 'nullable|string|max:100',
            'deadline'               => 'nullable|date',
            'file'                   => self::FILE_RULES,
        ]);

        $category = SubmissionCategory::find($data['submission_category_id']);
        if ($category && $category->code === 'OTHERS' && empty(trim((string) ($data['custom_category'] ?? '')))) {
            return back()->withErrors(['custom_category' => 'Please specify the submission category.']);
        }

        // Only persist the free-text label for the "Others" category.
        $data['custom_category'] = ($category && $category->code === 'OTHERS')
            ? trim((string) $data['custom_category'])
            : null;

        $document = $this->documents->create($request->user(), $data, $request->file('file'));

        $this->activityLogs->record(
            $request,
            'uploaded',
            'Documents',
            "Uploaded document {$document->title}.",
            $document
        );

        return back()->with('success', 'Document submitted for verification.');
    }

    public function addVersion(Request $request, Document $document): RedirectResponse
    {
        $this->authorizeOwnerOrAdmin($request, $document);

        $data = $request->validate([
            'file' => self::FILE_RULES,
            'note' => 'nullable|string|max:500',
        ]);

        $documentFile = $this->documents->addVersion($request->user(), $document, $request->file('file'), $data['note'] ?? null);

        $this->activityLogs->record(
            $request,
            'uploaded_version',
            'Documents',
            "Uploaded version {$documentFile->version} for document {$document->title}.",
            $document,
            ['version' => $documentFile->version]
        );

        return back()->with('success', 'New version uploaded. Document is awaiting re-verification.');
    }

    public function history(Request $request, Document $document): JsonResponse
    {
        $this->authorizeOwnerOrAdmin($request, $document);

        return response()->json($this->documents->history($document));
    }

    public function download(Request $request, Document $document, DocumentFile $file): StreamedResponse
    {
        abort_unless($file->document_id === $document->id, 404);
        $this->authorizeOwnerOrAdmin($request, $document);

        return $this->documents->download($file);
    }

    public function destroy(Request $request, Document $document): RedirectResponse
    {
        $this->authorizeOwnerOrAdmin($request, $document);

        $this->activityLogs->record(
            $request,
            'deleted',
            'Documents',
            "Deleted document {$document->title}.",
            $document
        );

        $this->documents->delete($document);

        return back()->with('success', 'Document deleted.');
    }

    private function isAdmin(Request $request): bool
    {
        return $request->user()->role === 'admin';
    }

    private function authorizeOwnerOrAdmin(Request $request, Document $document): void
    {
        $user = $request->user();

        abort_unless($user->role === 'admin' || $document->submitted_by === $user->id, 403);
    }
}
