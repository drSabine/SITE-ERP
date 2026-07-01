<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BoardExamResult extends Model
{
    protected $fillable = [
        'program_id', 'exam_name', 'exam_year', 'exam_month',
        'first_takers', 'first_taker_passers', 'retakers', 'retaker_passers',
        'remarks', 'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'exam_year'           => 'integer',
            'exam_month'          => 'integer',
            'first_takers'        => 'integer',
            'first_taker_passers' => 'integer',
            'retakers'            => 'integer',
            'retaker_passers'     => 'integer',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /** Newest intake first (year, then month). */
    public function scopeOrdered($query)
    {
        return $query->orderByDesc('exam_year')->orderByDesc('exam_month')->orderByDesc('id');
    }

    // Derived totals — kept here so controllers, services, and analytics agree.
    public function getTotalTakersAttribute(): int
    {
        return $this->first_takers + $this->retakers;
    }

    public function getTotalPassersAttribute(): int
    {
        return $this->first_taker_passers + $this->retaker_passers;
    }
}
