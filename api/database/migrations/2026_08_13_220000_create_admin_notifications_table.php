<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body');
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->boolean('is_broadcast')->default(false);
            $table->timestamps();
        });

        Schema::create('admin_notification_targets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('notification_id')->index();
            $table->unsignedBigInteger('restaurant_id')->index();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->unique(['notification_id', 'restaurant_id'], 'notif_restaurant_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_notification_targets');
        Schema::dropIfExists('admin_notifications');
    }
};
