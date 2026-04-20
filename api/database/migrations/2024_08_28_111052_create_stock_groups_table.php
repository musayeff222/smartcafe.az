<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStockGroupsTable extends Migration
{
    public function up()
    {
        Schema::create('stock_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('image')->nullable(); // For the image path
            $table->string('color')->nullable(); // Hex code or color name
            $table->boolean('kitchen_printer_active')->default(false);
            $table->boolean('bar_printer_active')->default(false);
            $table->boolean('show_on_qr_menu')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('stock_groups');
    }
}
