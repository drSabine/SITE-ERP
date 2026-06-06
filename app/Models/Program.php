<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Program extends Model
{
    protected $fillable = ['code', 'name', 'description', 'is_active', 'has_board_exam'];

    protected function casts(): array
    {
        return [
            'is_active'      => 'boolean',
            'has_board_exam' => 'boolean',
        ];
    }

    public function scopeWithBoardExam($query)
    {
        return $query->where('has_board_exam', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }
}
