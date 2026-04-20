<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRestaurantRequest;
use App\Http\Requests\SuperAdminUpdateRestaurantRequest;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuperAdminController extends Controller
{

    /**
     * Display a listing of the restaurants with optional filters.
     */
    public function index(Request $request)
    {
        // Start building the query
        $query = Restaurant::query();



        // Apply filters based on request parameters
        if ($request->has('name')) {
            $query->where('name', 'like', '%' . $request->query('name') . '%');
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('active_until')) {
            $query->where('active_until', '<=', $request->query('active_until'));
        }

        // Get the filtered list of restaurants
        $restaurants = $query
            ->with(['users' => function ($query) {
                $query->whereHas('roles', function ($roleQuery) {
                    $roleQuery->where('name', 'admin'); // Filter users by 'admin' role
                });
            }])
            ->get();

        // Return the list of restaurants
        return response()->json($restaurants);
    }

    //
    /**
     * Store a newly created restaurant and an admin user in storage.
     */
    public function store(StoreRestaurantRequest $request)
    {
        $data = $request->validated();

        // Start a transaction to ensure data integrity
        DB::beginTransaction();

        try {
            // Create the restaurant
            $restaurant = Restaurant::create([
                'name' => $data['name'],
                'logo' => $data['logo'] ?? null,
                'language' => $data['language'] ?? 'en',
                'currency' => $data['currency'] ?? 'USD',
                'custom_message' => $data['custom_message'] ?? null,
                'is_qr_active' => $data['is_qr_active'] ?? true,
                'get_qr_order' => $data['get_qr_order'] ?? true,
                'main_printer' => $data['main_printer'] ?? null,
                'kitchen_printer' => $data['kitchen_printer'] ?? null,
                'bar_printer' => $data['bar_printer'] ?? null,
                'email' => $data['email'] ?? $data['admin_email'] ?? null,
                'address' => $data['address'] ?? null,
                'phone' => $data['phone'] ?? null,
                'empty_table_color' => $data['empty_table_color'] ?? '#FF0000',
                'booked_table_color' => $data['booked_table_color'] ?? '#FFFF00',
                'is_active' => $data['is_active'] ?? true,
                'active_until' => $data['active_until'] ?? null,
            ]);

            // Check if the email already exists
            if (User::where('email', $data['admin_email'])->exists()) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Failed to create restaurant and admin.',
                    'error' => 'Email already exists.',
                ], 400);
            }

            // Create the admin user for this restaurant
            $admin = User::create([
                'name' => $data['admin_name'],
                'email' => $data['admin_email'],
                'password' => bcrypt($data['admin_password']),
                'restaurant_id' => $restaurant->id,
            ]);

            $admin->assignRole('admin');

            // Commit the transaction
            DB::commit();

            return response()->json([
                'message' => 'Restaurant and admin created successfully!',
                'restaurant' => $restaurant,
                'admin' => $admin,
            ], 201);
        } catch (\Exception $e) {
            // Rollback transaction if something goes wrong
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create restaurant and admin.',
                // 'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified restaurant and its associated admin user.
     */
    public function show(Request $request, $id)
    {
        // Get the restaurant by ID
        $restaurant = Restaurant::findOrFail($id);

        // Find the admin user for this restaurant
        $admin = $restaurant->users()
            ->whereHas('roles', function ($roleQuery) {
                $roleQuery->where('name', 'admin'); // Filter users by 'admin' role
            })
            ->first();

        // Return the restaurant and admin details
        return response()->json([
            'restaurant' => $restaurant,
            'admin' => $admin,
        ]);
    }

    /**
     * Update the specified restaurant and its admin user.
     */
    public function update(SuperAdminUpdateRestaurantRequest $request, $id)
    {
        $data = $request->validated();

        // Find the restaurant by ID
        $restaurant = Restaurant::findOrFail($id);

        // Start a transaction to ensure data integrity
        DB::beginTransaction();

        try {
            // Update the restaurant
            $restaurant->update([
                'name' => $data['name'] ?? $restaurant->name,
                'logo' => $data['logo'] ?? $restaurant->logo, // Retain existing logo if not provided
                'language' => $data['language'] ?? $restaurant->language,
                'currency' => $data['currency'] ?? $restaurant->currency,
                'custom_message' => $data['custom_message'] ?? $restaurant->custom_message,
                'is_qr_active' => $data['is_qr_active'] ?? $restaurant->is_qr_active,
                'get_qr_order' => $data['get_qr_order'] ?? $restaurant->get_qr_order,
                'main_printer' => $data['main_printer'] ?? $restaurant->main_printer,
                'kitchen_printer' => $data['kitchen_printer'] ?? $restaurant->kitchen_printer,
                'bar_printer' => $data['bar_printer'] ?? $restaurant->bar_printer,
                'email' => $data['email'] ?? $data['admin_email'] ?? $restaurant->email,
                'address' => $data['address'] ?? $restaurant->address,
                'phone' => $data['phone'] ?? $restaurant->phone,
                'empty_table_color' => $data['empty_table_color'] ?? $restaurant->empty_table_color,
                'booked_table_color' => $data['booked_table_color'] ?? $restaurant->booked_table_color,
                'is_active' => $data['is_active'] ?? $restaurant->is_active,
                'active_until' => $data['active_until'] ?? $restaurant->active_until,
            ]);

            // Update the admin user for this restaurant if admin details are provided
            if (isset($data['admin_name']) || isset($data['admin_email']) || isset($data['admin_password'])) {
                $admin = $restaurant->users()
                    ->whereHas('roles', function ($roleQuery) {
                        $roleQuery->where('name', 'admin'); // Filter users by 'admin' role
                    })
                    ->first();

                $admin->update([
                    'name' => $data['admin_name'] ?? $admin->name,
                    'email' => $data['admin_email'] ?? $admin->email,
                    'password' => isset($data['admin_password']) ? bcrypt($data['admin_password']) : $admin->password,
                ]);

                $admin->tokens()->delete();
            }

            // Commit the transaction
            DB::commit();

            return response()->json([
                'message' => 'Restaurant and admin updated successfully!',
                'restaurant' => $restaurant,
                'admin' => isset($admin) ? $admin : null,
            ], 200);
        } catch (\Exception $e) {
            // Rollback transaction if something goes wrong
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update restaurant and admin.',
                // 'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified restaurant from storage.
     */
    public function destroy(Request $request, $id)
    {
        // Check if the restaurant exists
        $restaurant = Restaurant::find($id);
        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found.'], 404);
        }
        try {

            DB::beginTransaction();

            $restaurant->users()->delete();
    
            // Delete the restaurant
            $restaurant->delete();
            
            DB::commit();
    
            // Return a success response
            return response()->json(['message' => 'Restaurant deleted successfully.']);
        } catch (\Exception $e) {
            // Rollback transaction if something goes wrong
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete restaurant.',
                // 'error' => $e->getMessage(),
            ], 500);
        }
    }
}
