<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolYear extends Model
{
    protected $fillable = ['name', 'start_date', 'end_date', 'is_active', 'status'];

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

    public function scopeOrdered($query)
    {
        return $query->orderByDesc('name');
    }

    public function academicTerms(): HasMany
    {
        return $this->hasMany(AcademicTerm::class);
    }
}
