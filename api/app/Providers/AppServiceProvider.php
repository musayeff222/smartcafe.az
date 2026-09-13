<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Canlı MySQL SSH tuneli ilə lokal işləyəndə ağır sorğular (masalar və s.)
        // 30 saniyə limitini aşa bilər — yalnız local mühitdə artırılır.
        if ($this->app->environment('local')) {
            set_time_limit(300);
            ini_set('max_execution_time', '300');
        }
    }
}
