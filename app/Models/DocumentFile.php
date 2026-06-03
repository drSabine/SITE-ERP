<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Backed by the `uploaded_files` table. Named DocumentFile to avoid clashing
 * with Illuminate\Http\UploadedFile in controllers and the service layer.
 */
class DocumentFile extends Model
{
    protected $table = 'uploaded_files';

    protected $fillable = [
        'document_id',
        'original_name',
        'stored_path',
        'mime_type',
        'size',
        'version',
        'note',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'size'    => 'integer',
            'version' => 'integer',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
