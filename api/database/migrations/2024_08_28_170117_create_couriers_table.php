<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCouriersTable extends Migration
{
    public function up()
    {
        Schema::create('couriers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade'); // Link to Restaurant
            $table->string('name');
            $table->string('phone');
            $table->string('address')->nullable(); // Optional address field
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('couriers');
    }
}

