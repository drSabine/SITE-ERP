<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    protected $fillable = ['enrollment_course_id', 'term_period_id', 'grade'];

    protected function casts(): array
    {
        return ['grade' => 'decimal:2'];
    }

    public function enrollmentCourse(): BelongsTo
    {
        return $this->belongsTo(EnrollmentCourse::class);
    }

    public function termPeriod(): BelongsTo
    {
        return $this->belongsTo(TermPeriod::class);
    }
}
