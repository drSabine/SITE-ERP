<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // grades = one row per (enrollment_course × term_period).
    // Teachers input the grade for each student in their course during each period.
    //
    // grade column:
    //   Null    = not yet graded (INC for this period — shows as red in UI)
    //   1.00    = highest passing
    //   1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00 = passing grades
    //   5.00    = failed
    //
    // Validation of allowed grade values is enforced at the service layer, not DB.
    // This keeps the schema flexible for edge cases (e.g., INC resolution at 0.00 raw override).

    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_course_id')->constrained('enrollment_courses')->onDelete('cascade');
            $table->foreignId('term_period_id')->constrained('term_periods')->onDelete('restrict');
            $table->decimal('grade', 3, 2)->nullable(); // null = INC for this period
            $table->timestamps();

            $table->unique(['enrollment_course_id', 'term_period_id']);
            $table->index('term_period_id');
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('grades');
        Schema::enableForeignKeyConstraints();
    }
};
