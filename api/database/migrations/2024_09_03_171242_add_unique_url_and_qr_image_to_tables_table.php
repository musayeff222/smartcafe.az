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
        Schema::table('tables', function (Blueprint $table) {
            if (!Schema::hasColumn('tables', 'unique_url')) {
                $table->string('unique_url')->unique()->after('id');
            }

            if (!Schema::hasColumn('tables', 'qr_image')) {
                $table->string('qr_image')->nullable()->after('unique_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            if (Schema::hasColumn('tables', 'unique_url')) {
                // $table->dropUnique(['unique_url']);
                $table->dropColumn('unique_url');
            }

            if (Schema::hasColumn('tables', 'qr_image')) {
                $table->dropColumn('qr_image');
            }
        });
    }
};

