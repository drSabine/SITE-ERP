<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // teacher_assignments = which teacher handles which course in which academic_term.
    // One teacher per course per term (for this department's scale).
    //
    // Teachers query their assignments to know which enrollment_courses they can grade:
    //   SELECT ec.* FROM enrollment_courses ec
    //   JOIN enrollments e ON e.id = ec.enrollment_id
    //   WHERE ec.course_id = :my_course_id
    //     AND e.academic_term_id = :my_academic_term_id
    //
    // The coordinator creates/updates these assignments at the start of each term.

    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('teacher_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->onDelete('restrict');
            $table->foreignId('course_id')->constrained('courses')->onDelete('restrict');
            $table->foreignId('academic_term_id')->constrained('academic_terms')->onDelete('restrict');
            $table->foreignId('section_id')->constrained('sections')->onDelete('restrict');
            $table->timestamps();

            // One teacher per section-course per term for this department.
            $table->unique(['academic_term_id', 'section_id', 'course_id']);
            $table->index(['teacher_id', 'academic_term_id']);
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('teacher_assignments');
        Schema::enableForeignKeyConstraints();
    }
};
