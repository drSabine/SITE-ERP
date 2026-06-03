<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('title', 191);
            $table->text('description')->nullable();
            $table->foreignId('submission_category_id')->constrained('submission_categories')->restrictOnDelete();
            $table->string('custom_category', 100)->nullable();   // free-text label when category is "Others"
            $table->foreignId('submitted_by')->constrained('users')->cascadeOnDelete();
            $table->string('status', 20)->default('pending');   // pending | verified | rejected
            $table->date('deadline')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->text('remarks')->nullable();                // latest verifier remark
            $table->timestamps();

            $table->index('status');
            $table->index('submission_category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
