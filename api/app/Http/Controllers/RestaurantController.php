<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Restaurant;
use App\Http\Requests\RestaurantRequest;
use App\Http\Requests\UpdateRestaurantRequest;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Carbon;
class RestaurantController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Retrieve all restaurants
        $restaurants = Restaurant::all();
        return response()->json($restaurants);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RestaurantRequest $request)
    {
        // Create a new restaurant

        $data = $request->validated();

        if ($request->hasFile('logo')) {
            $image = $request->file('logo');
            $imageName = uniqid() . '.' . $image->getClientOriginalExtension();
            $data['logo'] = $image->storeAs('restoran_logos', $imageName, 'public');
        }
        
        $restaurant = Restaurant::create($data);
        return response()->json($restaurant, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        // Find and return a specific restaurant by ID
        $restaurant = Restaurant::findOrFail($id);
        return response()->json($restaurant);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateRestaurantRequest $request, string $id)
    {
        // Find and update the specified restaurant
        $restaurant = Restaurant::findOrFail($id);

        $data = $request->validated();

        if ($request->hasFile('logo')) {
            if ($restaurant->image) {
                Storage::disk('public')->delete($restaurant->image);
            }

            $image = $request->file('logo');
            $imageName = uniqid() . '.' . $image->getClientOriginalExtension();
            $data['logo'] = $image->storeAs('restoran_logos', $imageName, 'public');
        }

        $restaurant->update($data);
        return response()->json($restaurant);
    }


    public function updateTimes(Request $request)
    {
        $validated = $request->validate([
            'open_time' => 'required|date_format:H:i',
            'close_time' => 'required|date_format:H:i',
        ]);

        $openTime = Carbon::createFromFormat('H:i', $validated['open_time']);
        $closeTime = Carbon::createFromFormat('H:i', $validated['close_time']);

        if ($closeTime->equalTo($openTime)) {
            return response()->json(['error' => 'Bağlanış saatı açılış saatı ilə eyni ola bilməz.'], 422);
        }

        $restaurant = $request->user()->loadMissing('restaurant')->restaurant;

        if (!$restaurant) {
            return response()->json(['error' => 'Restoran tapılmadı'], 404);
        }

        $restaurant->forceFill([
            'open_time' => $validated['open_time'],
            'close_time' => $validated['close_time'],
        ])->save();

        return response()->json([
            'message' => 'Restoran iş saatları uğurla yeniləndi.',
            'open_time' => $restaurant->open_time,
            'close_time' => $restaurant->close_time,
        ]);
    }


    public function getPrintMode(Request $request)
    {
        $restaurant = $request->user()->restaurant;

        if (!$restaurant) {
            return response()->json(['error' => 'Restoran tapılmadı'], 404);
        }

        return response()->json([
            'print_mode' => (int) $restaurant->print_mode,
            'mode' => $restaurant->print_mode == 1 ? 'printer' : 'kitchen'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // Find and delete the specified restaurant
        $restaurant = Restaurant::findOrFail($id);
        $restaurant->delete();
        return response()->json(null, 204);
    }

    /**
     * Get own restaurant.
     */
    /**
     * Get own restaurant.
     */
    public function getOwnRestaurant(Request $request)
    {
        // Get the restaurant of the authenticated user
        $restaurant = $request->user()->restaurant;

        if (!$restaurant) {
            return response()->json(['message' => 'No restaurant associated with this user.'], 404);
        }

        return response()->json($restaurant);
    }

    /**
     * Update own restaurant.
     */
    public function updateOwnRestaurant(UpdateRestaurantRequest $request)
    {
        // Get the restaurant of the authenticated user
        $restaurant = $request->user()->restaurant;

        if (!$restaurant) {
            return response()->json(['message' => 'No restaurant associated with this user.'], 404);
        }

        $data = $request->validated();

        if ($request->hasFile('logo')) {
            if ($restaurant->image) {
                Storage::disk('public')->delete($restaurant->image);
            }

            $image = $request->file('logo');
            $imageName = uniqid() . '.' . $image->getClientOriginalExtension();
            $data['logo'] = $image->storeAs('restoran_logos', $imageName, 'public');
        }

        // Update the restaurant
        $restaurant->update($data);

        return response()->json($restaurant);
    }
}
