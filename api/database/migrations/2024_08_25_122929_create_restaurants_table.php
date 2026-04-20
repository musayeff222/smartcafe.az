<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('restaurants', function (Blueprint $table) {
        $table->id();
        $table->string('name')->unique();
        $table->string('logo')->nullable();
        $table->string('language')->default('en');
        $table->string('currency')->default('USD');
        $table->text('custom_message')->nullable();
        $table->boolean('is_qr_active')->default(false);
        $table->boolean('get_qr_order')->default(false);
        $table->string('main_printer')->nullable();
        $table->string('kitchen_printer')->nullable();
        $table->string('bar_printer')->nullable();
        $table->string('email')->nullable();
        $table->string('address')->nullable();
        $table->string('phone')->nullable();
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restaurants');
    }
};
