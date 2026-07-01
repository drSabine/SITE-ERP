<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('board_exam_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained('programs')->onDelete('restrict');

            // Free-text licensure/board exam name, e.g. "Civil Engineer Licensure Exam".
            $table->string('exam_name', 191);

            // Intake identity. Exams are offered several times a year (commonly March and
            // September) — exam_month is recorder's discretion (1-12) so any intake is supported.
            $table->unsignedSmallInteger('exam_year');
            $table->unsignedTinyInteger('exam_month');

            // Aggregate counts only — no per-student rows. Everything the analytics needs
            // (total takers, total passers, did-not-pass, overall / first-taker / retaker
            // rates, taker composition) derives from these four numbers.
            $table->unsignedInteger('first_takers')->default(0);
            $table->unsignedInteger('first_taker_passers')->default(0);
            $table->unsignedInteger('retakers')->default(0);
            $table->unsignedInteger('retaker_passers')->default(0);

            $table->text('remarks')->nullable();

            // Who recorded it (audit trail; survives if the user is later removed).
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['program_id', 'exam_year', 'exam_month']);
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('board_exam_results');
        Schema::enableForeignKeyConstraints();
    }
};
