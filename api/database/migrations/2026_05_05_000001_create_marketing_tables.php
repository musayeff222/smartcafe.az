<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_site_contents', function (Blueprint $table) {
            $table->id();
            $table->string('locale', 8)->default('az');
            $table->json('payload');
            $table->timestamps();
            $table->unique('locale');
        });

        Schema::create('marketing_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug', 64)->unique();
            $table->string('tag', 64)->nullable();
            $table->text('pitch')->nullable();
            $table->string('price_label')->default('Fərdi təklif');
            $table->json('features')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('marketing_promo_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->enum('discount_type', ['percent', 'fixed'])->default('percent');
            $table->decimal('discount_value', 10, 2)->default(0);
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('uses_count')->default(0);
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->foreignId('marketing_plan_id')->nullable()->constrained('marketing_plans')->nullOnDelete();
            $table->boolean('show_on_landing')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_promo_codes');
        Schema::dropIfExists('marketing_plans');
        Schema::dropIfExists('marketing_site_contents');
    }
};
