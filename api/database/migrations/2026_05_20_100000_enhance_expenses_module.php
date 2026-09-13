<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expense_categories', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
            $table->boolean('is_system')->default(false)->after('slug');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('restaurant_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable()->after('expense_category_id');
            $table->date('expense_date')->nullable()->after('amount');
            $table->string('payment_method', 32)->default('cash')->after('expense_date');
            $table->string('status', 32)->default('paid')->after('payment_method');
            $table->foreignId('created_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->string('receipt_path')->nullable()->after('created_by');
            $table->text('note')->nullable()->after('receipt_path');
        });

        // Köhnə qeydlər üçün backfill
        if (Schema::hasTable('expenses') && Schema::hasColumn('expenses', 'restaurant_id')) {
            \Illuminate\Support\Facades\DB::statement('
                UPDATE expenses e
                INNER JOIN expense_categories c ON e.expense_category_id = c.id
                SET e.restaurant_id = c.restaurant_id
                WHERE e.restaurant_id IS NULL
            ');
            \Illuminate\Support\Facades\DB::statement("
                UPDATE expenses SET name = COALESCE(name, reason, 'Xərc'), note = COALESCE(note, reason),
                expense_date = COALESCE(expense_date, DATE(created_at))
                WHERE name IS NULL OR expense_date IS NULL
            ");
        }

        Schema::create('expense_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('daily_limit', 12, 2)->nullable();
            $table->decimal('anomaly_threshold', 12, 2)->nullable()->comment('Single expense above this triggers alert');
            $table->boolean('notify_unpaid')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_settings');

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('restaurant_id');
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn([
                'name',
                'expense_date',
                'payment_method',
                'status',
                'receipt_path',
                'note',
            ]);
        });

        Schema::table('expense_categories', function (Blueprint $table) {
            $table->dropColumn(['slug', 'is_system']);
        });
    }
};
