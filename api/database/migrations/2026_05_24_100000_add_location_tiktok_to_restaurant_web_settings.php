<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_web_settings', function (Blueprint $table) {
            $table->string('location_url')->nullable()->after('website_url');
            $table->string('tiktok_url')->nullable()->after('location_url');
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_web_settings', function (Blueprint $table) {
            $table->dropColumn(['location_url', 'tiktok_url']);
        });
    }
};
