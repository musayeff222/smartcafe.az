<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('restaurants')
            ->where(function ($q) {
                $q->where('language', '')
                    ->orWhereNull('language');
            })
            ->update(['language' => 'az']);

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE restaurants MODIFY language VARCHAR(255) NOT NULL DEFAULT 'az'");
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE restaurants MODIFY language VARCHAR(255) NOT NULL DEFAULT 'en'");
        }
    }
};
