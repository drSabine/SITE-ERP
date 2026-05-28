<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'program_id', 'course_code', 'title', 'units',
        'lec_hours', 'lab_hours', 'year_level', 'semester_type', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Used by "Load Standard Curriculum" feature
    public function scopeForSemester($query, int $yearLevel, string $semesterType)
    {
        return $query->where('year_level', $yearLevel)->where('semester_type', $semesterType);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function prerequisites(): BelongsToMany
    {
        return $this->belongsToMany(
            Course::class,
            'course_prerequisites',
            'course_id',
            'prerequisite_id'
        );
    }

    public function enrollmentCourses(): HasMany
    {
        return $this->hasMany(EnrollmentCourse::class);
    }

    public function teacherAssignments(): HasMany
    {
        return $this->hasMany(TeacherAssignment::class);
    }
}
