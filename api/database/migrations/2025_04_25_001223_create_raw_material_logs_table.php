<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('raw_material_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('raw_material_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['in', 'out']); // əlavə olunub yoxsa çıxarılıb
            $table->decimal('quantity', 10, 2);
            $table->string('reason')->nullable(); // məsələn: 'Sifariş', 'Əlavə', 'Silinmə'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raw_material_logs');
    }
};

