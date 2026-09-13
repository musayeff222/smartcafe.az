<?php

namespace App\Http\Controllers;

use App\Http\Requests\StockGroupRequest;
use App\Models\StockGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StockGroupController extends Controller
{
    public function index(Request $request)
    {
        // List all stock groups for a restaurant

        $restaurant = $request->user()->restaurant;

        // If the user does not have a restaurant, return an error
        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $stockGroups = StockGroup::where('restaurant_id', $restaurant->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
        return response()->json($stockGroups);
    }

    public function store(StockGroupRequest $request)
    {
        // Get the restaurant associated with the authenticated user
        $restaurant = $request->user()->restaurant;

        // If the user does not have a restaurant, return an error
        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        // Prepare the data, associating the stock group with the user's restaurant
        $data = $request->validated();
        $data['restaurant_id'] = $restaurant->id;

        if (!array_key_exists('sort_order', $data) || $data['sort_order'] === null) {
            $maxOrder = StockGroup::where('restaurant_id', $restaurant->id)->max('sort_order');
            $data['sort_order'] = ($maxOrder ?? 0) + 1;
        }

        // Handle image upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = uniqid() . '.' . $image->getClientOriginalExtension();
            $data['image'] = $image->storeAs($restaurant->id . '/stock_group_images', $imageName, 'public');
        }

        // Create a new stock group
        $stockGroup = StockGroup::create($data);
        return response()->json($stockGroup, 201);
    }

    public function show(Request $request, $id)
    {
        // Show a specific stock group

        // Get the restaurant associated with the authenticated user
        $restaurant = $request->user()->restaurant;

        // If the user does not have a restaurant, return an error
        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $stockGroup = StockGroup::where('restaurant_id', $restaurant->id)->findOrFail($id);
        return response()->json($stockGroup);
    }

    public function update(StockGroupRequest $request, $id)
    {
        // Get the restaurant associated with the authenticated user
        $restaurant = $request->user()->restaurant;

        // If the user does not have a restaurant, return an error
        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        // Find the stock group within the user's restaurant
        $stockGroup = StockGroup::where('restaurant_id', $restaurant->id)->findOrFail($id);

        $data = $request->validated();

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete the old image if it exists
            if ($stockGroup->image) {
                Storage::disk('public')->delete($stockGroup->image);
            }
            // Store the new image
            $image = $request->file('image');
            $imageName = uniqid() . '.' . $image->getClientOriginalExtension();
            $data['image'] = $image->storeAs($restaurant->id . '/stock_group_images', $imageName, 'public');
        }

        // Update the stock group
        $stockGroup->update($data);
        return response()->json($stockGroup);
    }

    public function destroy(Request $request, $id)
    {
        // Delete a stock group

        // Get the restaurant associated with the authenticated user
        $restaurant = $request->user()->restaurant;

        // If the user does not have a restaurant, return an error
        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $stockGroup = StockGroup::where('restaurant_id', $restaurant->id)->findOrFail($id);
        $stockGroup->delete();
        return response()->json(null, 204);
    }

    public function reorder(Request $request)
    {
        $restaurant = $request->user()->restaurant;

        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $validated = $request->validate([
            'order' => 'required|array|min:1',
            'order.*' => 'integer|distinct',
        ]);

        $ids = collect($validated['order'])->values()->all();
        $ownedCount = StockGroup::where('restaurant_id', $restaurant->id)
            ->whereIn('id', $ids)
            ->count();

        if ($ownedCount !== count($ids)) {
            return response()->json(['message' => 'Invalid group order.'], 422);
        }

        foreach ($ids as $index => $id) {
            StockGroup::where('restaurant_id', $restaurant->id)
                ->where('id', $id)
                ->update(['sort_order' => $index + 1]);
        }

        $stockGroups = StockGroup::where('restaurant_id', $restaurant->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json($stockGroups);
    }
}
