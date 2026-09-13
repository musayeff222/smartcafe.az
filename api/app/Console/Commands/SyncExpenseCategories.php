<?php

namespace App\Console\Commands;

use App\Models\Restaurant;
use App\Services\ExpenseCategoryDefaults;
use Illuminate\Console\Command;

class SyncExpenseCategories extends Command
{
    protected $signature = 'expenses:sync-categories';

    protected $description = 'Bütün restoranlar üçün standart xərc kateqoriyalarını yaradır';

    public function handle(): int
    {
        $count = 0;
        Restaurant::query()->pluck('id')->each(function (int $restaurantId) use (&$count) {
            ExpenseCategoryDefaults::ensureForRestaurant($restaurantId);
            $count++;
        });

        $this->info("Standart kateqoriyalar yoxlanıldı: {$count} restoran.");

        return self::SUCCESS;
    }
}
