<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Stock;
use App\Models\StockSet;
use Illuminate\Support\Facades\Storage;

class StockSetController extends Controller
{
    public function index(Request $request)
    {
        return StockSet::with('stocks')
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->get();
    }


public function store(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string',
        'price' => 'nullable|numeric',
        'image' => 'nullable|image|max:2048',
        'stocks' => 'required|array',
        'stocks.*.id' => 'required|exists:stocks,id',
        'stocks.*.quantity' => 'required|integer|min:1',
        'stocks.*.price' => 'nullable',
    ]);

    $validated['price'] = isset($validated['price']) ? floatval($validated['price']) : null;

    foreach ($validated['stocks'] as &$stock) {
        if (isset($stock['price'])) {
            $stock['price'] = floatval($stock['price']);
        }
    }


    $imagePath = null;
    if ($request->hasFile('image')) {
        $imagePath = $request->file('image')->store('stock_sets', 'public');
    }

    $set = StockSet::create([
        'restaurant_id' => $request->user()->restaurant_id,
        'name' => $validated['name'],
        'price' => $validated['price'],
        'image' => $imagePath,
    ]);

    foreach ($validated['stocks'] as $stockData) {
        $stockModel = Stock::findOrFail($stockData['id']);
        $price = $stockData['price'] ?? $stockModel->price;

        $set->stocks()->attach($stockData['id'], [
            'quantity' => $stockData['quantity'],
            'price' => $price,
        ]);
    }

    if (is_null($validated['price'])) {
        $set->update(['price' => $set->calculatePrice()]);
    }

    return response()->json([
        'message' => 'Stock Set created successfully!',
        'data' => $set->load('stocks')->append('image_url'),
    ]);
}


public function update(Request $request, $id)
{
    $validated = $request->validate([
        'name' => 'required|string',
        'price' => 'nullable|numeric',
        'image' => 'nullable|string', // Base64 string kimi gələcək
        'stocks' => 'required|array',
        'stocks.*.id' => 'required|exists:stocks,id',
        'stocks.*.quantity' => 'required|integer|min:1',
        'stocks.*.price' => 'nullable|numeric',
    ]);

    // Convert price to float if present
    $validated['price'] = isset($validated['price']) ? floatval($validated['price']) : null;

    foreach ($validated['stocks'] as &$stock) {
        if (isset($stock['price'])) {
            $stock['price'] = floatval($stock['price']);
        }
    }

    $set = StockSet::where('restaurant_id', $request->user()->restaurant_id)->findOrFail($id);

    if (!empty($validated['image']) && str_starts_with($validated['image'], 'data:image')) {
        // Köhnə şəkli sil
        if ($set->image) {
            Storage::disk('public')->delete($set->image);
        }

        preg_match('/data:image\/(\w+);base64,/', $validated['image'], $matches);
        $imageType = $matches[1] ?? 'png';
        $imageData = preg_replace('/^data:image\/\w+;base64,/', '', $validated['image']);
        $imageData = str_replace(' ', '+', $imageData);
        $decodedImage = base64_decode($imageData);

        $fileName = 'stock_sets/' . uniqid() . '.' . $imageType;
        Storage::disk('public')->put($fileName, $decodedImage);
        $set->image = $fileName;
    }

    $set->update([
        'name' => $validated['name'],
        'price' => $validated['price'],
        'image' => $set->image,
    ]);

    $set->stocks()->detach();
    foreach ($validated['stocks'] as $stockData) {
        $stockModel = Stock::findOrFail($stockData['id']);
        $price = $stockData['price'] ?? $stockModel->price;

        $set->stocks()->attach($stockData['id'], [
            'quantity' => $stockData['quantity'],
            'price' => $price,
        ]);
    }

    if (is_null($validated['price'])) {
        $set->update(['price' => $set->calculatePrice()]);
    }

    return response()->json([
        'message' => 'Stock Set updated successfully!',
        'data' => $set->load('stocks')->append('image_url'),
    ]);
}

    public function show(Request $request, $id)
    {
        $set = StockSet::with('stocks')
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->findOrFail($id)
            ->append('image_url');

        return $set;
    }

public function destroy(Request $request, $id)
{
    $set = StockSet::where('restaurant_id', $request->user()->restaurant_id)
                   ->where('id', $id)
                   ->first();

    if (!$set) {
        return response()->json(['message' => 'Stock Set tapılmadı.'], 404);
    }

    $set->delete();

    return response()->json(['message' => 'Stock Set uğurla silindi.']);
}

}
