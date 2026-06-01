<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // One enrollment row = one student in one academic_term (semester).
    // The coordinator creates this record when a student is officially enrolled for that term.
    // Course loads (enrollment_courses) are added separately by the coordinator.

    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('restrict');
            $table->foreignId('academic_term_id')->constrained('academic_terms')->onDelete('restrict');
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete(); // snapshot of student's program at enrollment time
            $table->unsignedTinyInteger('year_level'); // snapshot of student's year level at enrollment time
            $table->enum('status', ['enrolled', 'completed', 'dropped'])->default('enrolled');
            $table->timestamp('enrolled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('dropped_at')->nullable(); // set when student voluntarily drops mid-term
            $table->timestamps();

            // A student can only be enrolled once per academic term.
            $table->unique(['student_id', 'academic_term_id']);
            $table->index(['academic_term_id', 'status']);
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('enrollments');
        Schema::enableForeignKeyConstraints();
    }
};
