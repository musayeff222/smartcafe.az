<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('table_time_sessions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('table_id')->constrained('tables');
            $t->foreignId('order_id')->nullable()->constrained('orders'); // həmin masanın açıq sifarişi
            $t->enum('status', ['idle','running','paused','finished'])->default('idle');

            // vaxt idarəsi
            $t->timestamp('started_at')->nullable();
            $t->timestamp('paused_at')->nullable();
            $t->timestamp('ended_at')->nullable();
            $t->unsignedInteger('paused_seconds')->default(0); // cəm pauza

            // qiymətləndirmə rejimi
            $t->enum('billing_mode', ['per_minute','preset'])->default('per_minute');
            $t->unsignedInteger('minute_rate_qepik')->default(0); // 50 = 0.50 AZN
            $t->foreignId('time_preset_id')->nullable()->constrained('time_presets'); // seçilibsə

            // countdown üçün hədəf (preset seçiləndə)
            $t->unsignedInteger('target_minutes')->nullable(); // 20, 30 və s.

            // öncə hesablanmış nəticələr (audit üçün)
            $t->unsignedInteger('actual_seconds')->default(0);
            $t->decimal('amount', 10, 2)->default(0);
            $t->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('table_time_sessions');
    }
};
