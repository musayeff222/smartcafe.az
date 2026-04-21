<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // orders.status is used in every `/tables` and dashboard subquery.
        // Without an index MySQL full-scans ~120k rows each time.
        if (Schema::hasTable('orders') && !$this->indexExists('orders', 'orders_status_index')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index('status', 'orders_status_index');
            });
        }

        // Composite index for the common pattern: filter by status + join by id.
        if (Schema::hasTable('orders') && !$this->indexExists('orders', 'orders_status_id_index')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index(['status', 'id'], 'orders_status_id_index');
            });
        }

        // time_charges.order_id has no FK index; total_price subquery scans it.
        if (Schema::hasTable('time_charges') && !$this->indexExists('time_charges', 'time_charges_order_id_index')) {
            Schema::table('time_charges', function (Blueprint $table) {
                $table->index('order_id', 'time_charges_order_id_index');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if ($this->indexExists('orders', 'orders_status_index')) {
                    $table->dropIndex('orders_status_index');
                }
                if ($this->indexExists('orders', 'orders_status_id_index')) {
                    $table->dropIndex('orders_status_id_index');
                }
            });
        }

        if (Schema::hasTable('time_charges')) {
            Schema::table('time_charges', function (Blueprint $table) {
                if ($this->indexExists('time_charges', 'time_charges_order_id_index')) {
                    $table->dropIndex('time_charges_order_id_index');
                }
            });
        }
    }

    private function indexExists(string $table, string $index): bool
    {
        $database = DB::getDatabaseName();
        $rows = DB::select(
            'SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1',
            [$database, $table, $index]
        );
        return !empty($rows);
    }
};
