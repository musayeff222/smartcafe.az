<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQuickOrdersTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('quick_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade'); // Link to the restaurant
            $table->foreignId('order_id')->constrained()->onDelete('cascade'); // Link to the order
            $table->string('name');
            $table->string('phone');
            $table->string('address');
            $table->text('note')->nullable();
            $table->foreignId('courier_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('quick_orders');
    }
}

