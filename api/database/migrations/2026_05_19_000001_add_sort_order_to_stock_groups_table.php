<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_groups', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('name');
        });

        $counterByRestaurant = [];
        $groups = DB::table('stock_groups')->orderBy('restaurant_id')->orderBy('id')->get();

        foreach ($groups as $group) {
            $counterByRestaurant[$group->restaurant_id] = ($counterByRestaurant[$group->restaurant_id] ?? 0) + 1;
            DB::table('stock_groups')
                ->where('id', $group->id)
                ->update(['sort_order' => $counterByRestaurant[$group->restaurant_id]]);
        }
    }

    public function down(): void
    {
        Schema::table('stock_groups', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};
