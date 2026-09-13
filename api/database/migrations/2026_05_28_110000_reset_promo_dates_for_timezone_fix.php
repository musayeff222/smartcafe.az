<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Köhnə datetime-local dəyərləri UTC kimi saxlanılıb — səhv "hələ aktiv deyil" verirdi.
        DB::table('restaurant_web_promo_codes')->update([
            'valid_from' => null,
            'valid_until' => null,
        ]);
    }

    public function down(): void
    {
        // Geri qaytarmaq mümkün deyil
    }
};
