<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('restaurant_telegram_settings')) {
            return;
        }

        Schema::create('restaurant_telegram_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('restaurant_id')->unique();
            $table->text('bot_token')->nullable();
            $table->string('chat_id', 64)->nullable();
            $table->boolean('is_enabled')->default(false);
            $table->json('notify_events')->nullable();
            $table->boolean('daily_report_enabled')->default(false);
            $table->string('daily_report_time', 5)->default('22:00');
            $table->date('last_daily_report_on')->nullable();
            $table->timestamp('last_ok_at')->nullable();
            $table->timestamp('last_error_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->foreign('restaurant_id')->references('id')->on('restaurants')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_telegram_settings');
    }
};
