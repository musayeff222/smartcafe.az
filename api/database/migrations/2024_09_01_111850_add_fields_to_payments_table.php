<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddFieldsToPaymentsTable extends Migration
{
    public function up()
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('order_id'); // The user who handled the payment
            $table->string('order_name')->nullable()->after('user_id'); // For table or quick order name
            $table->timestamp('open_date')->nullable()->after('order_name'); // When the payment was opened
            $table->timestamp('close_date')->nullable()->after('open_date'); // When the payment was closed

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null'); // Foreign key constraint
        });
    }

    public function down()
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'order_name', 'open_date', 'close_date']);
        });
    }
}

