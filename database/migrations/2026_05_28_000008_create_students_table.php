<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            // Optional portal account. Null = no login access yet.
            $table->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('suffix', 20)->nullable();
            $table->enum('sex', ['Male', 'Female']);
            $table->text('address')->nullable();
            $table->string('contact_number', 30)->nullable();
            $table->string('email', 191)->nullable();
            $table->foreignId('program_id')->constrained('programs')->onDelete('restrict');

            // year_level = the student's current standing (1-4).
            // Maintained manually by the Program Coordinator.
            // NOT derived automatically — irregular students may have non-standard standings.
            $table->unsignedTinyInteger('year_level')->default(1);

            // transferred = left the school (voluntarily, to another institution)
            // dropped     = left mid-program for non-transfer reasons
            $table->enum('status', ['active', 'graduated', 'transferred', 'dropped', 'leave_of_absence'])->default('active');

            // Graduation record — set when a coordinator confirms a graduation.
            // The school year is stored so "graduates per S.Y." analytics survive renames.
            $table->foreignId('graduated_school_year_id')->nullable()->constrained('school_years')->nullOnDelete();
            $table->date('graduated_at')->nullable();

            $table->text('remarks')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['program_id', 'year_level', 'status']);
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('students');
        Schema::enableForeignKeyConstraints();
    }
};
