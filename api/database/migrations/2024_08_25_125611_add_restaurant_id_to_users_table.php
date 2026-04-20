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
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('restaurant_id')->nullable()->after('id');

            // Add foreign key constraint if you have the restaurants table
            $table->foreign('restaurant_id')->references('id')->on('restaurants')->onDelete('set null');
            $table->boolean('is_active')->default(true)->after('password');
            $table->timestamp('active_until')->nullable()->after('is_active');
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['restaurant_id']);
            $table->dropColumn('restaurant_id');
            $table->dropColumn('is_active');
            $table->dropColumn('active_until');
        });
    }
};
