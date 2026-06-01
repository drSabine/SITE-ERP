<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // enrollment_courses = the student's course load for a given enrollment (term).
    // The Program Coordinator adds and removes courses here.
    // Teachers see all rows pointing to their assigned course in the active academic_term.
    //
    // final_grade: computed after Finals period closes.
    //   Valid values: 1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00 (passing)
    //                 5.00 (failed)
    //   Null = not yet finalized (INC or in-progress).
    //
    // status lifecycle: active → passed / failed / inc / dropped
    //   inc   = Finals has passed but student has no complete grades (shown in red).
    //   Coordinator resolves INC by updating grades and re-computing.

    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('enrollment_courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('enrollments')->onDelete('cascade');
            $table->foreignId('course_id')->constrained('courses')->onDelete('restrict');
            $table->decimal('final_grade', 3, 2)->nullable(); // 1.00–3.00 or 5.00
            $table->enum('status', ['active', 'passed', 'failed', 'inc', 'dropped', 'credited'])->default('active');
            $table->timestamps();

            $table->unique(['enrollment_id', 'course_id']);
            $table->index(['course_id', 'status']);
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('enrollment_courses');
        Schema::enableForeignKeyConstraints();
    }
};
