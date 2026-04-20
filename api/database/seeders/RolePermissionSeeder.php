<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        // Define the guard name
        $guardName = 'web'; // Change to 'sanctum' if you use Sanctum for API authentication

        // Create Roles with specified guard
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => $guardName]);
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => $guardName]);
        $user = Role::firstOrCreate(['name' => 'waiter', 'guard_name' => $guardName]);

        // Define unique permissions
        $permissions = [
            'manage-restaurants',
            'manage-users',
            'manage-roles',
            'assign-roles',
            'assign-permissions',
            'manage-stock-groups',
            'manage-stocks',
            'manage-couriers',
            'manage-tables',
            'manage-table-groups',
            'manage-customers',
            'manage-tanimlar',
            'access-payments',
            'manage-payments',
            'manage-quick-orders',
            'table-order',
        ];

        // Create permissions with the specified guard
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => $guardName]);
        }

        // Assign all permissions to the super-admin role
        $superAdmin->givePermissionTo(Permission::all());

        // Assign specific permissions to the admin role
        $adminPermissions = [
            'manage-restaurants',
            'manage-users',
            'manage-roles',
            'assign-roles',
            'assign-permissions',
            'manage-stock-groups',
            'manage-stocks',
            'manage-couriers',
            'manage-tables',
            'manage-table-groups',
            'manage-customers',
            'manage-tanimlar',
            'access-payments',
            'manage-payments',
            'manage-quick-orders',
        ];
        $admin->givePermissionTo($adminPermissions);

        // Assign specific permission to the user role
        $user->givePermissionTo('table-order');
    }
}
