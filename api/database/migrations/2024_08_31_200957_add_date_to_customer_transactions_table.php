<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDateToCustomerTransactionsTable extends Migration
{
    public function up()
    {
        Schema::table('customer_transactions', function (Blueprint $table) {
            $table->date('date')->nullable(); // Add date column
        });
    }

    public function down()
    {
        Schema::table('customer_transactions', function (Blueprint $table) {
            $table->dropColumn('date');
        });
    }
}

