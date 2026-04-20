<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIsActiveAndActiveUntilToRestaurantsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('booked_table_color');  // Add `is_active` column
            $table->dateTime('active_until')->nullable()->after('is_active');  // Add `active_until` column
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn('is_active');
            $table->dropColumn('active_until');
        });
    }
}

