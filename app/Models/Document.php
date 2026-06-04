<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Document extends Model
{
    protected $fillable = [
        'title',
        'description',
        'submission_category_id',
        'custom_category',
        'submitted_by',
        'status',
        'deadline',
        'verified_by',
        'verified_at',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'deadline'    => 'date',
            'verified_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeVerified($query)
    {
        return $query->where('status', 'verified');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    // Relationships
    public function category(): BelongsTo
    {
        return $this->belongsTo(SubmissionCategory::class, 'submission_category_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function files(): HasMany
    {
        return $this->hasMany(DocumentFile::class);
    }

    public function latestFile(): HasOne
    {
        return $this->hasOne(DocumentFile::class)->latestOfMany('version');
    }

    public function verificationRecords(): HasMany
    {
        return $this->hasMany(VerificationRecord::class);
    }
}
