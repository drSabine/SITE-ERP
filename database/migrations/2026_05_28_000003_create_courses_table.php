<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained('programs')->onDelete('restrict');
            $table->string('course_code', 50);   // e.g., ITE 101, GEC 105
            $table->string('title', 191);
            $table->unsignedTinyInteger('units')->default(3);
            $table->unsignedTinyInteger('lec_hours')->default(3);
            $table->unsignedTinyInteger('lab_hours')->default(0);

            // Reference values only — NOT enrollment constraints.
            // Irregular students can take any course the coordinator assigns.
            $table->unsignedTinyInteger('year_level')->nullable();  // 1, 2, 3, 4
            $table->enum('semester_type', ['first', 'second', 'summer'])->nullable();

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['program_id', 'course_code']);
            $table->index(['program_id', 'year_level', 'semester_type']);
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('courses');
        Schema::enableForeignKeyConstraints();
    }
};
