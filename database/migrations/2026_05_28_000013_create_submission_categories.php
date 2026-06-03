<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submission_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();   // ISO, PAASCU, PQA, UNIWIDE, PACCOA, CHED, TESDA, OTHERS
            $table->string('name', 100);             // Human-readable label
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submission_categories');
    }
};
