<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quick_orders', function (Blueprint $table) {
            $table->string('promo_code', 64)->nullable()->after('note');
            $table->decimal('promo_discount', 10, 2)->default(0)->after('promo_code');
        });
    }

    public function down(): void
    {
        Schema::table('quick_orders', function (Blueprint $table) {
            $table->dropColumn(['promo_code', 'promo_discount']);
        });
    }
};
