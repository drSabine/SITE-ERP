<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentFile;
use App\Models\SubmissionCategory;
use App\Models\User;
use App\Models\VerificationRecord;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentService
{
    /** Private disk — files are streamed through an authorized controller, never served directly. */
    private const DISK = 'local';
    private const DIRECTORY = 'documents';

    /**
     * Paginated document list. Non-admins only ever see their own submissions.
     */
    public function listFor(User $user, array $filters): LengthAwarePaginator
    {
        $query = Document::with([
            'category'   => fn ($relation) => $relation->select('id', 'code', 'name'),
            'submitter'  => fn ($relation) => $relation->select('id', 'name', 'role'),
            'verifier'   => fn ($relation) => $relation->select('id', 'name'),
            'latestFile' => fn ($relation) => $relation->select(
                'uploaded_files.id',
                'uploaded_files.document_id',
                'uploaded_files.original_name',
                'uploaded_files.version',
                'uploaded_files.size',
                'uploaded_files.created_at'
            ),
        ])->select(
            'id', 'title', 'description', 'submission_category_id', 'custom_category', 'submitted_by',
            'status', 'deadline', 'verified_by', 'verified_at', 'remarks', 'created_at'
        );

        if (! $this->isAdmin($user)) {
            $query->where('submitted_by', $user->id);
        }

        if (! empty($filters['category'])) {
            $query->where('submission_category_id', $filters['category']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($inner) use ($search) {
                $inner->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate(10)->withQueryString();
    }

    /**
     * Pending queue used by the admin verification page.
     */
    public function pendingQueue(): LengthAwarePaginator
    {
        return Document::with([
            'category'   => fn ($relation) => $relation->select('id', 'code', 'name'),
            'submitter'  => fn ($relation) => $relation->select('id', 'name', 'role'),
            'latestFile' => fn ($relation) => $relation->select(
                'uploaded_files.id',
                'uploaded_files.document_id',
                'uploaded_files.original_name',
                'uploaded_files.version',
                'uploaded_files.size',
                'uploaded_files.created_at'
            ),
        ])
            ->select('id', 'title', 'description', 'submission_category_id', 'custom_category', 'submitted_by', 'status', 'deadline', 'created_at')
            ->pending()
            ->oldest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * Monitoring overview: totals + per-category breakdown, scoped per role.
     */
    public function statusOverview(User $user): array
    {
        $base = Document::query();
        if (! $this->isAdmin($user)) {
            $base->where('submitted_by', $user->id);
        }

        $counts = (clone $base)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $summary = [
            'total'    => (int) $counts->sum(),
            'pending'  => (int) ($counts['pending'] ?? 0),
            'verified' => (int) ($counts['verified'] ?? 0),
            'rejected' => (int) ($counts['rejected'] ?? 0),
        ];

        $perCategory = (clone $base)
            ->selectRaw('submission_category_id, status, count(*) as total')
            ->groupBy('submission_category_id', 'status')
            ->get()
            ->groupBy('submission_category_id');

        $categories = SubmissionCategory::active()
            ->ordered()
            ->get(['id', 'code', 'name'])
            ->map(function ($category) use ($perCategory) {
                $rows = $perCategory->get($category->id, collect());

                return [
                    'id'       => $category->id,
                    'code'     => $category->code,
                    'name'     => $category->name,
                    'total'    => (int) $rows->sum('total'),
                    'pending'  => (int) ($rows->firstWhere('status', 'pending')->total ?? 0),
                    'verified' => (int) ($rows->firstWhere('status', 'verified')->total ?? 0),
                    'rejected' => (int) ($rows->firstWhere('status', 'rejected')->total ?? 0),
                ];
            });

        return ['summary' => $summary, 'categories' => $categories];
    }

    public function create(User $user, array $data, UploadedFile $file): Document
    {
        return DB::transaction(function () use ($user, $data, $file) {
            $document = Document::create([
                'title'                  => $data['title'],
                'description'            => $data['description'] ?? null,
                'submission_category_id' => $data['submission_category_id'],
                'custom_category'        => $data['custom_category'] ?? null,
                'submitted_by'           => $user->id,
                'status'                 => 'pending',
                'deadline'               => $data['deadline'] ?? null,
            ]);

            $this->storeFile($document, $user, $file, 1);

            return $document;
        });
    }

    /**
     * Upload a new version of an existing document. Re-opens it for verification.
     */
    public function addVersion(User $user, Document $document, UploadedFile $file, ?string $note): DocumentFile
    {
        return DB::transaction(function () use ($user, $document, $file, $note) {
            $nextVersion = (int) ($document->files()->max('version') ?? 0) + 1;

            $documentFile = $this->storeFile($document, $user, $file, $nextVersion, $note);

            $document->update([
                'status'      => 'pending',
                'verified_by' => null,
                'verified_at' => null,
                'remarks'     => null,
            ]);

            return $documentFile;
        });
    }

    public function verify(User $admin, Document $document, string $action, ?string $remarks): void
    {
        $status = $action === 'approve' ? 'verified' : 'rejected';

        DB::transaction(function () use ($admin, $document, $status, $remarks) {
            $document->update([
                'status'      => $status,
                'verified_by' => $admin->id,
                'verified_at' => now(),
                'remarks'     => $remarks,
            ]);

            VerificationRecord::create([
                'document_id' => $document->id,
                'verified_by' => $admin->id,
                'action'      => $status,
                'remarks'     => $remarks,
            ]);
        });
    }

    /**
     * Combined file-version + verification timeline for the history modal.
     */
    public function history(Document $document): array
    {
        $document->load([
            'files' => fn ($relation) => $relation
                ->with('uploader:id,name')
                ->orderByDesc('version'),
            'verificationRecords' => fn ($relation) => $relation
                ->with('verifier:id,name')
                ->latest(),
        ]);

        return [
            'files' => $document->files->map(fn ($file) => [
                'id'            => $file->id,
                'original_name' => $file->original_name,
                'version'       => $file->version,
                'size'          => $file->size,
                'note'          => $file->note,
                'uploaded_by'   => $file->uploader?->name,
                'created_at'    => $file->created_at,
                'download_url'  => route('documents.download', [$document->id, $file->id]),
            ]),
            'records' => $document->verificationRecords->map(fn ($record) => [
                'id'          => $record->id,
                'action'      => $record->action,
                'remarks'     => $record->remarks,
                'verified_by' => $record->verifier?->name,
                'created_at'  => $record->created_at,
            ]),
        ];
    }

    public function download(DocumentFile $file): StreamedResponse
    {
        abort_unless(Storage::disk(self::DISK)->exists($file->stored_path), 404);

        return Storage::disk(self::DISK)->download($file->stored_path, $file->original_name);
    }

    public function delete(Document $document): void
    {
        DB::transaction(function () use ($document) {
            foreach ($document->files as $file) {
                Storage::disk(self::DISK)->delete($file->stored_path);
            }

            // verification_records + uploaded_files cascade on FK delete
            $document->delete();
        });
    }

    private function storeFile(Document $document, User $user, UploadedFile $file, int $version, ?string $note = null): DocumentFile
    {
        $path = $file->store(self::DIRECTORY, self::DISK);

        return $document->files()->create([
            'original_name' => $file->getClientOriginalName(),
            'stored_path'   => $path,
            'mime_type'     => $file->getClientMimeType(),
            'size'          => $file->getSize(),
            'version'       => $version,
            'note'          => $note,
            'uploaded_by'   => $user->id,
        ]);
    }

    private function isAdmin(User $user): bool
    {
        return $user->role === 'admin';
    }
}
