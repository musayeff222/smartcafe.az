<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('time_presets', function (Blueprint $t) {
            $t->id();
            $t->string('name');          // "20 dəqiqə · 5 AZN"
            $t->unsignedInteger('minutes');
            $t->decimal('price', 10, 2); // total
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('time_presets');
    }
};
