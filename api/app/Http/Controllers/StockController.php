<?php

namespace App\Http\Controllers;

use App\Models\Stock;
use Illuminate\Http\Request;
use App\Http\Requests\StockRequest;
use Illuminate\Support\Facades\Storage;

class StockController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        //

        $restaurant = $request->user()->restaurant;

        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $query = Stock::where('restaurant_id', $restaurant->id);

        if ($request->has('stock_group_id')) {
            $query->where('stock_group_id', $request->query('stock_group_id'));
        }

        $stocks = $query->get();
        return response()->json($stocks->load('details'));

    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StockRequest $request)
    {
        $restaurant = $request->user()->restaurant;

        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $data = $request->validated();
        $data['restaurant_id'] = $restaurant->id;

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = uniqid() . '.' . $image->getClientOriginalExtension();
            $data['image'] = $image->storeAs($restaurant->id . '/stock_images', $imageName, 'public');
        }


        $stock = Stock::create($data);


        if ($request->filled('additionalPrices')) {
            foreach ($request->input('additionalPrices') as $detail) {
                $stock->details()->create($detail);
            }
        }

        return response()->json($stock->load('details'), 201);
    }


    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        //
        $restaurant = $request->user()->restaurant;

        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $stock = Stock::where('restaurant_id', $restaurant->id)->findOrFail($id);
        return response()->json($stock->load('details'));
    }


    public function simpleList(Request $request)
    {
        $restaurant = $request->user()->restaurant;
    
        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $stocks = Stock::where('restaurant_id', $restaurant->id)
            ->select('id','image','name','price')
            ->get();
    
        return response()->json($stocks);
    }



    /**
     * Update the specified resource in storage.
     */
    public function update(StockRequest $request, string $id)
    {
        //
        $restaurant = $request->user()->restaurant;

        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $stock = Stock::where('restaurant_id', $restaurant->id)->findOrFail($id);

        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($stock->image) {
                Storage::disk('public')->delete($stock->image);
            }

            $image = $request->file('image');
            $imageName = uniqid() . '.' . $image->getClientOriginalExtension();
            $data['image'] = $image->storeAs($restaurant->id . '/stock_images', $imageName, 'public');
        }

        $stock->update($data);
        return response()->json($stock->load('details'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        //
        $restaurant = $request->user()->restaurant;

        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $stock = Stock::where('restaurant_id', $restaurant->id)->findOrFail($id);

        if ($stock->image) {
            Storage::disk('public')->delete($stock->image);
        }

        $stock->delete();
        return response()->json(null, 204);
    }


    public function stockFresh(Request $request)
    {
        $restaurant = auth()->user()->restaurant;

        try {
            Stock::where('restaurant_id', $restaurant->id)
                ->update(['amount' => 0]);

            $stocks = Stock::where('restaurant_id', $restaurant->id)->get();

            return response()->json([
                'message' => 'Stocks successfully reset to 0.',
                'data' => $stocks,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reset stocks.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }



}
