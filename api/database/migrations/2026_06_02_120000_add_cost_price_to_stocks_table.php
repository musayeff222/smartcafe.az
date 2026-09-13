<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('stocks', 'cost_price')) {
            Schema::table('stocks', function (Blueprint $table) {
                $table->decimal('cost_price', 10, 2)->nullable()->after('price');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('stocks', 'cost_price')) {
            Schema::table('stocks', function (Blueprint $table) {
                $table->dropColumn('cost_price');
            });
        }
    }
};
