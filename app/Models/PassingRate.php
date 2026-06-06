<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PassingRate extends Model
{
    protected $fillable = [
        'program_id',
        'exam_month',
        'exam_year',
        'total_takers',
        'passers_count',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'exam_month' => 'integer',
        'exam_year' => 'integer',
        'total_takers' => 'integer',
        'passers_count' => 'integer',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function getPassingPercentageAttribute(): float
    {
        return round($this->passers_count / max(1, $this->total_takers) * 100, 1);
    }

    public function scopeForProgram($query, int $programId)
    {
        return $query->where('program_id', $programId);
    }
}
