<?php

namespace App\Http\Controllers;

use App\Models\Stock;
use App\Models\RawMaterial;
use Illuminate\Http\Request;

class StockMaterialController extends Controller
{
    public function link(Request $request)
    {
        $validated = $request->validate([
            'stock_id' => 'required|exists:stocks,id',
            'raw_material_id' => 'required|exists:raw_materials,id',
            'quantity' => 'required|numeric|min:0',
        ]);

        $stock = Stock::findOrFail($validated['stock_id']);

        $stock->rawMaterials()->syncWithoutDetaching([
            $validated['raw_material_id'] => ['quantity' => $validated['quantity']]
        ]);

        return response()->json([
            'message' => 'Raw material successfully linked to stock',
        ]);
    }

    public function detachRawMaterial(Request $request, Stock $stock)
    {
        $validated = $request->validate([
            'raw_material_id' => 'required|exists:raw_materials,id',
        ]);

        $stock->rawMaterials()->detach($validated['raw_material_id']);

        return response()->json([
            'message' => 'Raw material successfully detached from stock',
        ]);
    }
}