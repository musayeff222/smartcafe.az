<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('customer_transactions', 'payment_method')) {
                $table->string('payment_method', 20)->nullable()->after('type');
            }
            if (!Schema::hasColumn('customer_transactions', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('customer_id')->constrained()->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('customer_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('customer_transactions', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }
            if (Schema::hasColumn('customer_transactions', 'payment_method')) {
                $table->dropColumn('payment_method');
            }
        });
    }
};
