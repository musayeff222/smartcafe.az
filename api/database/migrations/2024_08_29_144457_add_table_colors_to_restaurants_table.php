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
        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('empty_table_color')->default('#FF0000')->after('phone'); // Add column after 'phone' or adjust as needed
            $table->string('booked_table_color')->default('#FFFF00')->after('empty_table_color'); // Add column after 'empty_table_color'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['empty_table_color', 'booked_table_color']);
        });
    }
};
