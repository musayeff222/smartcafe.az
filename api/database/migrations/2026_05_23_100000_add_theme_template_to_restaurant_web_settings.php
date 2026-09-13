<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_web_settings', function (Blueprint $table) {
            $table->string('theme_template', 20)->default('classic')->after('bg_color');
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_web_settings', function (Blueprint $table) {
            $table->dropColumn('theme_template');
        });
    }
};
