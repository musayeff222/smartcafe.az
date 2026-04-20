<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use Spatie\Permission\Models\Role;


use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

/*        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
*/
        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin']);

        // Create a Super-Admin User
        $user = User::firstOrCreate([
            'email' => 'lsgrmusazad@gmail.com'
        ], [
            'name' => 'Super Admin',
            'password' => bcrypt('Musayeff@05++'), // Change 'password' to your desired password
        ]);

	$user->update([
    'email' => 'lsgrmusazad@gmail.com',        // New email
    'password' => bcrypt('Musayeff@05++'),      // New password (hash it)
]);

        // Assign the Super-Admin Role to the User
/*        $user->assignRole($superAdminRole);

        // Create a Restaurant
        $restaurant = Restaurant::create([
            'name' => 'My Restaurant',
            'address' => '123 Main St',
            // Add other restaurant details here
        ]);

        $adminUser = User::firstOrCreate([
            'email' => 'admin@example.com',
        ], [
            'name' => 'Restaurant Admin',
            'password' => bcrypt('password'), // Change 'password' to your desired password
        ]);

        // Assign the Admin Role to the User
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminUser->assignRole($adminRole);

        // Assign the Restaurant to the Admin User
        $adminUser->restaurant()->associate($restaurant);
        $adminUser->save();*/
    }
}
