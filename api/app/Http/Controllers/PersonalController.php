<?php

namespace App\Http\Controllers;

use App\Http\Requests\PersonalRequest;
use App\Http\Requests\UpdatePersonalRequest;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PersonalController extends Controller
{

    /**
     * Define an array of allowed permissions.
     */
    private $allowedPermissions = [
        'manage-restaurants',
        'manage-tanimlar',
        'access-payments',
        'manage-payments',
        'manage-customers',
        'manage-tables',
        'manage-quick-orders',
        // Add more allowed permissions as needed
    ];

    /**
     * Display a listing of the personal.
     */
    public function index(Request $request)
    {
        // Get all users of the restaurant
        $personals = User::where('restaurant_id', $request->user()->restaurant_id)
            ->with('roles', 'permissions')
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['general', 'waiter']); // Assuming 'name' is the field in the roles table
            })
            ->get();

        return response()->json(['data' => $personals], 200);
    }

    /**
     * Store a newly created personal.
     */
    public function store(PersonalRequest $request)
    {
        DB::beginTransaction();
        try {
        // Create a new user with general or waiter role
        $personal = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password), // Hash the password
            'restaurant_id' => $request->user()->restaurant_id, // Assign the restaurant_id
        ]);

        // Assign role
        $roleName = $request->role;
        $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']); // Ensure 'web' guard is used
        $personal->assignRole($role);

        // If the role is 'general', assign specific permissions
        if ($roleName === 'general' && $request->has('permissions')) {
            $permissions = $this->filterValidPermissions($request->permissions);
            $personal->syncPermissions($permissions);
        }
        DB::commit();
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['message' => 'An error occurred while creating the personal'], 500);
    }

        return response()->json(['message' => 'Personal created successfully', 'data' => $personal->load('roles', 'permissions')], 201);
    }

    /**
     * Display the specified personal.
     */
    public function show(Request $request, $id)
    {
        // Find the user
        $personal = User::where('restaurant_id', $request->user()->restaurant_id)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['general', 'waiter']); // Assuming 'name' is the field in the roles table
            })
            ->findOrFail($id);

        return response()->json(['data' => $personal->load('roles', 'permissions')], 200);
    }

    /**
     * Update the specified personal.
     */
    public function update(UpdatePersonalRequest $request, User $personal)
    {
        DB::beginTransaction();
        try {
        // Find the user
        $personal = User::where('restaurant_id', $request->user()->restaurant_id)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['general', 'waiter']); // Assuming 'name' is the field in the roles table
            })
            ->findOrFail($personal->id);

        // Update user details
        $personal->update([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->filled('password') ? bcrypt($request->password) : $personal->password, // Hash the password if it exists in the request, otherwise keep the existing password
        ]);

        // Assign role
        $roleName = $request->role;
        $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']); // Ensure 'web' guard is used
        $personal->syncRoles([$role]);

        // If the role is 'general', assign specific permissions
        if ($roleName === 'general' && $request->has('permissions')) {
            $permissions = $this->filterValidPermissions($request->permissions);
            $personal->syncPermissions($permissions);
        } else {
            $personal->syncPermissions([]); // Clear permissions if not 'general'
        }

        $personal->tokens()->delete(); // Revoke all tokens

        DB::commit();
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['message' => 'An error occurred while updating the personal'], 500);
    }

        return response()->json(['message' => 'Personal updated successfully', 'data' => $personal->load('roles', 'permissions')], 200);
    }

    /**
     * Filter and return valid permissions from the request.
     */
    private function filterValidPermissions(array $requestedPermissions)
    {
        return array_filter($requestedPermissions, function ($permission) {
            return in_array($permission, $this->allowedPermissions);
        });
    }

    /**
     * Remove the specified personal.
     */
    public function destroy(Request $request, $id)
    {
        // Find the user
        $personal = User::where('restaurant_id', $request->user()->restaurant_id)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['general', 'waiter']); // Assuming 'name' is the field in the roles table
            })
            ->findOrFail($id);
        // Delete the user
        $personal->delete();

        return response()->json(['message' => 'Personal deleted successfully'], 200);
    }
}
