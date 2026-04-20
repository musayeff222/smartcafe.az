<?php

namespace App\Http\Controllers;

use App\Models\RawMaterial;
use App\Models\RawMaterialStock;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RawMaterialController extends Controller
{
    private int|null $restaurantId;

    public function __construct(Request $request)
    {
        $this->restaurantId = $request->user()?->restaurant_id;
    }

    public function index(Request $request): JsonResponse
    {
        if (!$this->restaurantId) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }
    
        $materials = RawMaterial::with('stock')
            ->select('id', 'name', 'unit', 'restaurant_id')
            ->where('restaurant_id', $this->restaurantId)
            ->orderByDesc('id')
            ->get();
    
        return response()->json($materials);
    }


public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'name' => "required|string|max:255|unique:raw_materials,name,NULL,id,restaurant_id,{$this->restaurantId}",
        'unit' => 'required|integer',
    ]);

    $validated['restaurant_id'] = $this->restaurantId;
    $material = RawMaterial::create($validated);

    return response()->json([
        'message' => 'Raw material created successfully',
        'data' => $material->only(['id', 'name', 'unit'])
    ], 201);
}


    public function show(int $id): JsonResponse
    {
        $material = $this->findRestaurantMaterial($id);
        if (!$material) {
            return response()->json(['message' => 'Raw material not found.'], 404);
        }

        $material->load('stock');

        return response()->json($material->only(['id', 'name', 'unit']) + ['quantity' => $material->stock?->quantity ?? 0]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $material = $this->findRestaurantMaterial($id);
        if (!$material) {
            return response()->json(['message' => 'Raw material not found.'], 404);
        }

        $validated = $request->validate([
            'name' => "sometimes|required|string|max:255|unique:raw_materials,name,{$id},id,restaurant_id,{$this->restaurantId}",
            'unit' => 'sometimes|required|integer',
            'quantity' => 'sometimes|required|numeric|min:0',
        ]);

        $material->update($validated);

        if (isset($validated['quantity'])) {
            $material->stock()->updateOrCreate([], ['quantity' => $validated['quantity']]);
        }

        return response()->json([
            'message' => 'Raw material updated successfully',
            'data' => $material->only(['id', 'name', 'unit']) + ['quantity' => $material->stock?->quantity ?? 0]
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $material = $this->findRestaurantMaterial($id);
        if (!$material) {
            return response()->json(['message' => 'Raw material not found.'], 404);
        }

        $material->delete();

        return response()->json(['message' => 'Raw material deleted successfully']);
    }

    public function attachRawMaterials(Request $request, Stock $stock): JsonResponse
    {
        $validated = $request->validate([
            'raw_materials' => 'required|array|min:1',
            'raw_materials.*.id' => 'required|exists:raw_materials,id',
            'raw_materials.*.quantity' => 'required|numeric|min:0.01',
        ]);

        if ($stock->restaurant_id !== $this->restaurantId) {
            return response()->json(['message' => 'You cannot access this stock.'], 403);
        }

        $syncData = [];

        foreach ($validated['raw_materials'] as $material) {
            $rawMaterial = RawMaterial::select('id')
                ->where('id', $material['id'])
                ->where('restaurant_id', $this->restaurantId)
                ->first();

            if (!$rawMaterial) {
                return response()->json([
                    'message' => "Raw material ID {$material['id']} not found or not accessible."
                ], 403);
            }

            $syncData[$rawMaterial->id] = ['quantity' => $material['quantity']];
        }

        $stock->rawMaterials()->syncWithoutDetaching($syncData);

        return response()->json(['message' => 'Raw materials successfully attached to stock.']);
    }

    public function getRawMaterials(Stock $stock, Request $request): JsonResponse
    {
        if ($stock->restaurant_id !== $request->user()->restaurant_id) {
            return response()->json(['message' => 'You cannot access this stock.'], 403);
        }

        $materials = $stock->rawMaterials()
            ->select('raw_materials.id', 'raw_materials.name', 'raw_materials.unit')
            ->withPivot('quantity')
            ->get();

        return response()->json($materials);
    }

    public function updateMultipleRawMaterials(Request $request, Stock $stock): JsonResponse
    {
        $validated = $request->validate([
            'raw_materials' => 'required|array|min:1',
            'raw_materials.*.id' => 'required|exists:raw_materials,id',
            'raw_materials.*.quantity' => 'required|numeric|min:0.01',
        ]);

        if ($stock->restaurant_id !== $request->user()->restaurant_id) {
            return response()->json(['message' => 'You cannot access this stock.'], 403);
        }

        $updates = [];

        foreach ($validated['raw_materials'] as $item) {


            $updates[$item['id']] = ['quantity' => $item['quantity']];
        }

        if (empty($updates)) {
            return response()->json(['message' => 'No valid raw materials to update.'], 422);
        }

        $stock->rawMaterials()->syncWithoutDetaching($updates);

        return response()->json(['message' => 'Raw material quantities updated successfully.']);
    }

    private function findRestaurantMaterial(int $id): ?RawMaterial
    {
        return RawMaterial::with('stock')
            ->select('id', 'name', 'unit', 'restaurant_id')
            ->where('id', $id)
            ->where('restaurant_id', $this->restaurantId)
            ->first();
    }

    public function increaseStock(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'reason' => 'nullable|string|max:255',
        ]);
    
        $material = $this->findRestaurantMaterial($id);
        if (!$material) {
            return response()->json(['message' => 'Raw material not found.'], 404);
        }
    
        $stock = $material->stock()->firstOrCreate([], ['quantity' => 0]);
        $stock->increment('quantity', $validated['quantity']);
    
        $material->logs()->create([
            'type' => 'in',
            'quantity' => $validated['quantity'],
            'reason' => $validated['reason'] ?? 'Əlavə'
        ]);
    
        return response()->json(['message' => 'Quantity increased successfully.']);
    }

    public function decreaseStock(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'reason' => 'nullable|string|max:255',
        ]);
    
        $material = $this->findRestaurantMaterial($id);
        if (!$material) {
            return response()->json(['message' => 'Raw material not found.'], 404);
        }
    
        $stock = $material->stock;
        if (!$stock || $stock->quantity < $validated['quantity']) {
            return response()->json(['message' => 'Not enough stock.'], 400);
        }
    
        $stock->decrement('quantity', $validated['quantity']);
    
        $material->logs()->create([
            'type' => 'out',
            'quantity' => $validated['quantity'],
            'reason' => $validated['reason'] ?? 'İstifadə'
        ]);
    
        return response()->json(['message' => 'Quantity decreased successfully.']);
    }


    public function getStockLogs($id): JsonResponse
    {
        if (!is_numeric($id) || $id === 'null') {
            return response()->json([]); 
        }
    
        $material = $this->findRestaurantMaterial((int)$id);
        if (!$material) {
            return response()->json(['message' => 'Raw material not found.'], 404);
        }
    
        $logs = $material->logs()->latest()->get();
    
        return response()->json($logs);
    }





}
