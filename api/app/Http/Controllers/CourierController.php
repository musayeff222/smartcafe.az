<?php

namespace App\Http\Controllers;

use App\Models\Courier;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Requests\CourierRequest;

class CourierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Get the authenticated user's restaurant ID
        $restaurantId = Auth::user()->restaurant_id;

        // Start building the query
        $query = Courier::where('restaurant_id', $restaurantId);

        // Apply filters if they are provided in the request
        if ($request->has('name')) {
            $query->where('name', 'like', '%' . $request->input('name') . '%');
        }

        if ($request->has('phone')) {
            $query->where('phone', 'like', '%' . $request->input('phone') . '%');
        }

        if ($request->has('address')) {
            $query->where('address', 'like', '%' . $request->input('address') . '%');
        }

        // Execute the query and get the results
        $couriers = $query->get();

        // Return the filtered couriers as JSON
        return response()->json($couriers);
    }




    /**
     * Store a newly created resource in storage.
     */
    public function store(CourierRequest $request)
    {
        $data = $request->validated();

        // Create a new courier associated with the user's restaurant
        $data['restaurant_id'] = Auth::user()->restaurant_id;
        $courier = Courier::create($data);

        return response()->json($courier, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $courier = Courier::where('restaurant_id', Auth::user()->restaurant_id)->findOrFail($id);
        return response()->json($courier);
    }



    /**
     * Update the specified resource in storage.
     */
    public function update(CourierRequest $request, string $id)
    {
        $courier = Courier::findOrFail($id);

        // Ensure the courier belongs to the user's restaurant
        if ($courier->restaurant_id != Auth::user()->restaurant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $courier->update($request->validated());

        return response()->json($courier);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
        $courier = Courier::findOrFail($id);

        // Ensure the courier belongs to the user's restaurant
        if ($courier->restaurant_id != Auth::user()->restaurant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $courier->delete();

        return response()->json(['message' => 'Courier deleted successfully']);
    }
}
