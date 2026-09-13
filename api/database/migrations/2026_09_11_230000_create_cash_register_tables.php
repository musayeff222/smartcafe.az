<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('cash_register_sessions')) {
            Schema::create('cash_register_sessions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
                $table->unsignedBigInteger('opened_by')->nullable();
                $table->unsignedBigInteger('closed_by')->nullable();
                $table->decimal('opening_amount', 10, 2)->default(0);
                $table->decimal('closing_amount', 10, 2)->nullable();
                $table->decimal('expected_amount', 10, 2)->nullable();
                $table->decimal('difference_amount', 10, 2)->nullable();
                $table->string('note')->nullable();
                $table->timestamp('opened_at');
                $table->timestamp('closed_at')->nullable();
                $table->timestamps();
                $table->index(['restaurant_id', 'closed_at']);
            });
        } else {
            Schema::table('cash_register_sessions', function (Blueprint $table) {
                if (!Schema::hasColumn('cash_register_sessions', 'opened_by')) {
                    $table->unsignedBigInteger('opened_by')->nullable();
                }
                if (!Schema::hasColumn('cash_register_sessions', 'closed_by')) {
                    $table->unsignedBigInteger('closed_by')->nullable();
                }
                if (!Schema::hasColumn('cash_register_sessions', 'opening_amount')) {
                    $table->decimal('opening_amount', 10, 2)->default(0);
                }
                if (!Schema::hasColumn('cash_register_sessions', 'closing_amount')) {
                    $table->decimal('closing_amount', 10, 2)->nullable();
                }
                if (!Schema::hasColumn('cash_register_sessions', 'expected_amount')) {
                    $table->decimal('expected_amount', 10, 2)->nullable();
                }
                if (!Schema::hasColumn('cash_register_sessions', 'difference_amount')) {
                    $table->decimal('difference_amount', 10, 2)->nullable();
                }
            });
        }

        if (!Schema::hasTable('cash_register_movements')) {
            Schema::create('cash_register_movements', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('session_id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('type', 20);
                $table->decimal('amount', 10, 2);
                $table->string('note')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_register_movements');
    }
};
