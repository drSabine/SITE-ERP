<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'first_name', 'middle_name', 'last_name',
        'suffix', 'sex', 'address', 'contact_number', 'email',
        'program_id', 'year_level', 'status', 'remarks',
        'graduated_school_year_id', 'graduated_at',
    ];

    protected function casts(): array
    {
        return [
            'graduated_at' => 'date',
        ];
    }

    public function graduatedSchoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class, 'graduated_school_year_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('last_name')->orderBy('first_name');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function getFullNameAttribute(): string
    {
        $middle = $this->middle_name ? " {$this->middle_name}" : '';
        $suffix = $this->suffix ? " {$this->suffix}" : '';
        return "{$this->last_name}, {$this->first_name}{$middle}{$suffix}";
    }
}
