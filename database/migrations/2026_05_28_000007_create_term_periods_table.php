<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // term_periods = the grading windows inside each academic_term.
    // Standard: Preliminary, Midterm, Finals.
    // Summer terms can have the same three periods or fewer — coordinator decides
    // which periods to create. No hard enforcement.
    //
    // is_active = whether this is the current open period for grade entry.
    // Only one period per academic_term should be active at a time (enforced at service layer).

    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('term_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_term_id')->constrained('academic_terms')->onDelete('restrict');
            $table->enum('period', ['preliminary', 'midterm', 'finals']);
            $table->boolean('is_active')->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();

            $table->unique(['academic_term_id', 'period']);
            $table->index('academic_term_id');
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('term_periods');
        Schema::enableForeignKeyConstraints();
    }
};
