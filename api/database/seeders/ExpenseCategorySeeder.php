<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use App\Services\ExpenseCategoryDefaults;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        Restaurant::query()->pluck('id')->each(function (int $restaurantId) {
            ExpenseCategoryDefaults::ensureForRestaurant($restaurantId);
        });
    }
}
