<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('time_presets', function (Blueprint $t) {
             $t->index(['table_id','is_active']);
              // eyni ad+dəqiqə kombinasiya bir restoranda tək olsun:
             $t->unique(['table','minutes','price']);
        });
    }

    public function down(): void
    {
        Schema::table('time_presets', function (Blueprint $t) {
            $t->dropConstrainedForeignId('table_id');
            $t->dropIndex(['table_id','is_active']);
            $t->dropUnique(['table','minutes','price']);
        });
    }
};
