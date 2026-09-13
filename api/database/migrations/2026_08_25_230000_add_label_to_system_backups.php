<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('system_backups')) {
            return;
        }
        if (!Schema::hasColumn('system_backups', 'label')) {
            Schema::table('system_backups', function (Blueprint $table) {
                $table->string('label')->nullable()->after('name');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('system_backups') && Schema::hasColumn('system_backups', 'label')) {
            Schema::table('system_backups', function (Blueprint $table) {
                $table->dropColumn('label');
            });
        }
    }
};
