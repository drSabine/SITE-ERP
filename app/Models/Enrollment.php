<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    protected $fillable = [
        'student_id', 'academic_term_id', 'status', 'enrolled_at', 'completed_at', 'dropped_at',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_at'   => 'datetime',
            'completed_at'  => 'datetime',
            'dropped_at'    => 'datetime',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'enrolled');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function academicTerm(): BelongsTo
    {
        return $this->belongsTo(AcademicTerm::class);
    }

    public function enrollmentCourses(): HasMany
    {
        return $this->hasMany(EnrollmentCourse::class);
    }
}
