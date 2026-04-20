<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStocksTable extends Migration
{
    public function up()
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade'); // Link to Restaurant
            $table->foreignId('stock_group_id')->nullable()->constrained()->onDelete('set null'); // Link to StockGroup, can be null
            $table->string('name');
            $table->string('image')->nullable(); // Image path
            $table->boolean('show_on_qr')->default(false);
            $table->decimal('price', 10, 2); // Price with two decimal places
            $table->integer('amount'); // Current amount in stock
            $table->integer('critical_amount'); // Critical amount threshold
            $table->boolean('alert_critical')->default(false);
            $table->time('order_start')->nullable(); // Start time for ordering
            $table->time('order_stop')->nullable(); // Stop time for ordering
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('stocks');
    }
}
