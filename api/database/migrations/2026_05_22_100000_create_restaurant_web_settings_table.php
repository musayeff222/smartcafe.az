<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_web_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('slug', 80)->unique();
            $table->string('custom_domain', 255)->nullable()->unique();
            $table->string('domain_status', 20)->default('none'); // none | pending | active
            $table->boolean('is_active')->default(true);
            $table->boolean('accept_orders')->default(true);
            $table->string('web_title')->nullable();
            $table->string('web_subtitle')->nullable();
            $table->string('theme_color', 20)->default('#6366f1');
            $table->string('bg_color', 20)->default('#f8fafc');
            $table->string('banner_path')->nullable();
            $table->string('instagram_url')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('website_url')->nullable();
            $table->text('domain_note')->nullable();
            $table->decimal('min_order_amount', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_web_settings');
    }
};
