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
        Schema::create('grouped_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('stocks')->onDelete('cascade'); // yeni yaradılan qrup
            $table->foreignId('child_stock_id')->constrained('stocks')->onDelete('cascade'); // daxil edilən məhsullar
            $table->unsignedInteger('quantity')->default(1); // hər birindən neçə ədəd
            $table->timestamps();
        });        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grouped_stocks');
    }
};
