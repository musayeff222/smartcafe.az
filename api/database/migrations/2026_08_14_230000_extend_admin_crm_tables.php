<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_notifications', function (Blueprint $table) {
            if (!Schema::hasColumn('admin_notifications', 'type')) {
                $table->string('type', 32)->default('info')->after('body');
            }
            if (!Schema::hasColumn('admin_notifications', 'priority')) {
                $table->string('priority', 16)->default('normal')->after('type');
            }
            if (!Schema::hasColumn('admin_notifications', 'link')) {
                $table->string('link', 500)->nullable()->after('priority');
            }
            if (!Schema::hasColumn('admin_notifications', 'icon')) {
                $table->string('icon', 80)->nullable()->after('link');
            }
            if (!Schema::hasColumn('admin_notifications', 'status')) {
                $table->string('status', 24)->default('sent')->after('is_broadcast');
            }
            if (!Schema::hasColumn('admin_notifications', 'failed_count')) {
                $table->unsignedInteger('failed_count')->default(0)->after('status');
            }
        });

        if (!Schema::hasColumn('users', 'pending_email')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('pending_email')->nullable()->after('email');
                $table->string('email_change_token', 80)->nullable()->after('pending_email');
                $table->timestamp('email_change_expires_at')->nullable()->after('email_change_token');
            });
        }

        if (!Schema::hasTable('website_settings')) {
            Schema::create('website_settings', function (Blueprint $table) {
                $table->id();
                $table->string('group', 40)->default('general')->index();
                $table->string('key')->unique();
                $table->json('value')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('website_packages')) {
            Schema::create('website_packages', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->nullable()->index();
                $table->text('description')->nullable();
                $table->decimal('price', 12, 2)->default(0);
                $table->decimal('old_price', 12, 2)->nullable();
                $table->unsignedTinyInteger('discount_percent')->nullable();
                $table->string('badge', 40)->nullable();
                $table->string('color', 24)->nullable();
                $table->string('cta_text', 80)->nullable();
                $table->string('cta_url', 255)->nullable();
                $table->json('features')->nullable();
                $table->json('limits')->nullable();
                $table->decimal('monthly_price', 12, 2)->nullable();
                $table->decimal('yearly_price', 12, 2)->nullable();
                $table->unsignedInteger('duration_days')->nullable();
                $table->unsignedInteger('trial_days')->nullable();
                $table->boolean('is_active')->default(true)->index();
                $table->unsignedInteger('sort_order')->default(0)->index();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('system_backups')) {
            Schema::create('system_backups', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('path')->nullable();
                $table->unsignedBigInteger('size_bytes')->default(0);
                $table->string('status', 24)->default('pending')->index();
                $table->string('type', 24)->default('auto');
                $table->text('error')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamp('finished_at')->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('restaurants') && !Schema::hasColumn('restaurants', 'package_id')) {
            Schema::table('restaurants', function (Blueprint $table) {
                $table->unsignedBigInteger('package_id')->nullable()->after('active_until')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('restaurants', 'package_id')) {
            Schema::table('restaurants', function (Blueprint $table) {
                $table->dropColumn('package_id');
            });
        }
        Schema::dropIfExists('system_backups');
        Schema::dropIfExists('website_packages');
        Schema::dropIfExists('website_settings');
        if (Schema::hasColumn('users', 'pending_email')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn(['pending_email', 'email_change_token', 'email_change_expires_at']);
            });
        }
    }
};
