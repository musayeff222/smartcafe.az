<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('time_presets', function (Blueprint $table) {
            $table->unsignedBigInteger('table_id')->nullable()->after('id');
            $table->foreign('table_id')->references('id')->on('tables')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::table('time_presets', function (Blueprint $table) {
            $table->dropForeign(['table_id']);
            $table->dropColumn(['table_id']);
        });
    }
};
