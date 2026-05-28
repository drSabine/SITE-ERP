<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EnrollmentCourse extends Model
{
    protected $fillable = ['enrollment_id', 'course_id', 'final_grade', 'status'];

    protected function casts(): array
    {
        return ['final_grade' => 'decimal:2'];
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePassed($query)
    {
        return $query->where('status', 'passed');
    }

    public function scopeWithInc($query)
    {
        return $query->where('status', 'inc');
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }
}
