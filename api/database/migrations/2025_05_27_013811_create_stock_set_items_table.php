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
        if (Schema::hasTable('stock_set_items')) {
            return; // artıq var — keç
        }
        
        Schema::create('stock_set_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('stock_set_id');
            $table->unsignedBigInteger('stock_id');
            $table->integer('quantity');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_set_items');
    }
};
