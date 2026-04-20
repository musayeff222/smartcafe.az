<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TableGroup;

class TableGroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $restaurantId = 1; // Assuming you're seeding for a specific restaurant with ID 1. Adjust as necessary.

        $tableGroups = [
            ['name' => 'Salon', 'restaurant_id' => $restaurantId],
            ['name' => 'Bahce', 'restaurant_id' => $restaurantId],
        ];

        foreach ($tableGroups as $group) {
            TableGroup::create($group);
        }
    }
}
