<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // academic_terms = the "semesters" within a school year.
    // A school year typically has: 1st Semester, 2nd Semester, and optionally Summer.
    // Each academic_term is the unit at which students enroll and receive their course loads.
    //
    // The "term_periods" table below stores the Prelim/Midterm/Finals grading windows
    // that live inside each academic_term.

    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('academic_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('restrict');
            $table->enum('semester', ['first', 'second', 'summer']);
            $table->boolean('is_active')->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();

            $table->unique(['school_year_id', 'semester']);
            $table->index('school_year_id');
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('academic_terms');
        Schema::enableForeignKeyConstraints();
    }
};
