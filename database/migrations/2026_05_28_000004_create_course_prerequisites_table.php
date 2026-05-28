<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        // Stores the pre-requisite relationships from the curriculum.
        // Enforcement happens at the service layer (soft warning, not hard block)
        // so coordinators can override for irregular students.
        Schema::create('course_prerequisites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->foreignId('prerequisite_id')->constrained('courses')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['course_id', 'prerequisite_id']);
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('course_prerequisites');
        Schema::enableForeignKeyConstraints();
    }
};
