<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uploaded_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->string('original_name', 191);
            $table->string('stored_path', 191);
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size')->default(0);   // bytes
            $table->unsignedInteger('version')->default(1);
            $table->string('note', 500)->nullable();          // optional version note
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['document_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uploaded_files');
    }
};
