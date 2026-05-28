<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TermPeriod extends Model
{
    protected $fillable = ['academic_term_id', 'period', 'is_active', 'start_date', 'end_date'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date'   => 'date',
            'is_active'  => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function academicTerm(): BelongsTo
    {
        return $this->belongsTo(AcademicTerm::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function getPeriodLabelAttribute(): string
    {
        return match ($this->period) {
            'preliminary' => 'Preliminary',
            'midterm'     => 'Midterm',
            'finals'      => 'Finals',
            default       => $this->period,
        };
    }
}
