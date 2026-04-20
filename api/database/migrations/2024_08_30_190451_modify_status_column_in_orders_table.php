<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ModifyStatusColumnInOrdersTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Modify the existing 'status' column to include 'canceled'
            $table->enum('status', ['pending_approval', 'approved', 'completed', 'canceled'])
                ->default('pending_approval')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Revert the 'status' column to its previous state if necessary
            $table->enum('status', ['pending_approval', 'approved', 'completed'])
                ->default('pending_approval')
                ->change();
        });
    }
}


