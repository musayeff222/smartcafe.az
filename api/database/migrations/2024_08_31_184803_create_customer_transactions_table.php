<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCustomerTransactionsTable extends Migration
{
    public function up()
    {
        Schema::create('customer_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2); // Amount of the transaction
            $table->enum('type', ['credit', 'debit']); // Type of transaction
            $table->text('note')->nullable(); // Optional note for the transaction
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('customer_transactions');
    }
}

