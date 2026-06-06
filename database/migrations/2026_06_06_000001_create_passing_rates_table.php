<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('passing_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained('programs')->onDelete('cascade');
            $table->tinyInteger('exam_month'); // 1–12
            $table->smallInteger('exam_year');
            $table->unsignedInteger('total_takers');
            $table->unsignedInteger('passers_count');
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['program_id', 'exam_year', 'exam_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('passing_rates');
    }
};
