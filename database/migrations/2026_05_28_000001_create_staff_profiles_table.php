<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('staff_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('employee_id', 50)->unique();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('suffix', 20)->nullable();
            $table->enum('sex', ['Male', 'Female'])->nullable();
            $table->date('birthdate')->nullable();
            $table->text('address')->nullable();
            $table->string('contact_number', 30)->nullable();
            $table->string('specialization', 191)->nullable(); // e.g., "Software Engineering"
            $table->string('degree', 191)->nullable();         // e.g., "MIT", "MSCS"
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('staff_profiles');
        Schema::enableForeignKeyConstraints();
    }
};
