<?php

namespace App\Http\Controllers;

use App\Http\Requests\AddStockToOrderRequest;
use App\Http\Requests\QuickOrderRequest;
use App\Models\Courier;
use App\Models\QuickOrder;
use App\Models\Order;
use App\Models\Stock;
use App\Models\StockDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuickOrderController extends Controller
{

    public function index(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;  // Get restaurant ID of the authenticated user

        $quickOrders = QuickOrder::where('restaurant_id', $restaurantId)
            ->whereHas('order', function ($query) {
                $query->where('status', 'approved');
            })
            ->with(['order' => function ($query) {
                $query
                    ->select('id', 'status')
                    ->withSum('stocks as total_price', DB::raw('stocks.price * order_stock.quantity'))
                    ->withSum('prepayments as total_prepayment', 'amount');
            }])
            ->with(['courier' => function ($query) {
                $query->select('id', 'name');  // Select only 'id' and 'name' for courier
            }])
            ->get();

        return response()->json($quickOrders);
    }

    //
    public function store(QuickOrderRequest $request)
    {
        DB::beginTransaction();

        try {
            $restaurantId = $request->user()->restaurant_id;  // Get restaurant ID of the authenticated user

            // Validate that all stocks belong to the user's restaurant
            $stockIds = collect($request->stocks)->pluck('stock_id');
            $stockCount = Stock::where('restaurant_id', $restaurantId)
                ->whereIn('id', $stockIds)
                ->count();

            if ($stockCount !== count($stockIds)) {
                return response()->json(['message' => 'One or more stocks do not belong to your restaurant.'], 403);
            }

            if ($request->courier_id) {
                $courierExists = Courier::where('restaurant_id', $restaurantId)
                    ->where('id', $request->courier_id)
                    ->exists();

                if (!$courierExists) {
                    return response()->json(['message' => 'Selected courier does not belong to your restaurant.'], 403);
                }
            }

            // Create a new Order
            $order = Order::create([
                'user_id' => $request->user()->id, // Assuming orders are linked to the authenticated user
                'restaurant_id' => $restaurantId,
                'status' => 'approved', // Default status
            ]);

            // Attach stocks to the order

            if ($request->stocks) {
                return response()->json(['message' => 'Please provide stocks for the order.'], 400);
                foreach ($request->stocks as $stock) {
                    $order->stocks()->attach($stock['stock_id'], [
                        'quantity' => $stock['quantity'],
                    ]);
                }
            }

            // Create the QuickOrder
            $quickOrder = QuickOrder::create([
                'restaurant_id' => $restaurantId,
                'order_id' => $order->id,
                'name' => $request->name,
                'phone' => $request->phone,
                'address' => $request->address,
                'note' => $request->note,
                'courier_id' => $request->courier_id,  // Assign courier if provided
            ]);

            DB::commit();

            return response()->json($quickOrder->load('order.stocks'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating quick order', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, $id)
    {
        $restaurantId = $request->user()->restaurant_id; // Get restaurant ID of the authenticated user

        // Find the QuickOrder in the user's restaurant
        $quickOrder = QuickOrder::where('restaurant_id', $restaurantId)->findOrFail($id);

        if ($quickOrder->order->status !== 'approved') {
            return response()->json(['message' => 'Order status is not approved.'], 403);
        }

        // Load related data
        $quickOrder->load([
            'order.stocks.details', // Load stock details
            'order.prepayments',
            'courier:id,name', // Load courier data with selected fields
        ]);

        $response = [
            'id' => $quickOrder->id,
            'order' => [
                'id' => $quickOrder->order->id,
                'status' => $quickOrder->order->status,
                'stocks' => $quickOrder->order->stocks->map(function ($stock) {
                    $detail = $stock->pivot->detail_id
                        ? StockDetail::find($stock->pivot->detail_id)->only(['id', 'price', 'unit', 'count'])
                        : null;

                    $price = $detail
                        ? ($stock->pivot->quantity > 1 ? $detail['price'] * $stock->pivot->quantity : $detail['price'])
                        : $stock->price * $stock->pivot->quantity;

                    return [
                        'pivot_id' => $stock->pivot->id,
                        'id' => $stock->id,
                        'name' => $stock->name,
                        'quantity' => $stock->pivot->quantity,
                        'price' => $price,
                        'detail' => $detail,
                    ];
                }),
                'prepayments' => $quickOrder->order->prepayments,
                'total_prepayment' => $quickOrder->order->prepayments->sum('amount'),
                'total_price' => $quickOrder->order->stocks->sum(function ($stock) {
                    $detail = $stock->pivot->detail_id
                        ? StockDetail::find($stock->pivot->detail_id)->only(['price', 'unit', 'count'])
                        : null;

                    return $detail
                        ? ($stock->pivot->quantity > 1 ? $detail['price'] * $stock->pivot->quantity : $detail['price'])
                        : $stock->price * $stock->pivot->quantity;
                }),
            ],
            'courier' => $quickOrder->courier ? [
                'id' => $quickOrder->courier->id,
                'name' => $quickOrder->courier->name,
            ] : null,
        ];

        return response()->json($response, 200);
    }


    public function update(QuickOrderRequest $request, $id)
    {
        $restaurantId = $request->user()->restaurant_id;  // Get restaurant ID of the authenticated user

        // Find the QuickOrder in the user's restaurant
        $quickOrder = QuickOrder::where('restaurant_id', $restaurantId)->findOrFail($id);

        if ($quickOrder->order->status !== 'approved') {
            return response()->json(['message' => 'Order status is not approved.'], 403);
        }

        // Check if the provided courier belongs to the user's restaurant
        if ($request->courier_id) {
            $courierExists = Courier::where('restaurant_id', $restaurantId)
                ->where('id', $request->courier_id)
                ->exists();

            if (!$courierExists) {
                return response()->json(['message' => 'Selected courier does not belong to your restaurant.'], 403);
            }
        }

        DB::beginTransaction();

        try {
            // Update the QuickOrder details
            $quickOrder->update([
                'name' => $request->name,
                'phone' => $request->phone,
                'address' => $request->address,
                'note' => $request->note,
                'courier_id' => $request->courier_id,  // Update courier if provided
            ]);

            DB::commit();

            return response()->json($quickOrder->load('order.stocks', 'courier'), 200);  // Load courier relationship

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating quick order', 'error' => $e->getMessage()], 500);
        }
    }


    public function destroy(Request $request, $id)
    {
        $restaurantId = $request->user()->restaurant_id;  // Get restaurant ID of the authenticated user

        // Find the QuickOrder in the user's restaurant
        $quickOrder = QuickOrder::where('restaurant_id', $restaurantId)->findOrFail($id);

        DB::beginTransaction();

        try {
            // Delete the associated Order and its stocks
            $quickOrder->order->stocks()->detach();  // Detach stocks
            $quickOrder->order->delete();  // Delete the order

            // Delete the QuickOrder
            $quickOrder->delete();

            DB::commit();

            return response()->json(['message' => 'Quick order deleted successfully.'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error deleting quick order', 'error' => $e->getMessage()], 500);
        }
    }

    public function addStock(AddStockToOrderRequest $request, $quickOrderId)
    {
        $restaurantId = $request->user()->restaurant_id; // Get restaurant ID of the authenticated user

        // Find the QuickOrder in the user's restaurant
        $quickOrder = QuickOrder::where('restaurant_id', $restaurantId)->findOrFail($quickOrderId);

        // Validate that the stock belongs to the user's restaurant
        $stock = Stock::where('restaurant_id', $restaurantId)
            ->where('id', $request->stock_id)
            ->first();

        if (!$stock) {
            return response()->json(['message' => 'Selected stock does not belong to your restaurant.'], 403);
        }

        if ($quickOrder->order->status !== 'approved') {
            return response()->json(['message' => 'Order status is not approved.'], 403);
        }

        DB::beginTransaction();

        try {
            $order = $quickOrder->order;

            // Check if the stock already exists in the order
            $existingStock = $order->stocks()
                ->where('stock_id', $request->stock_id)
                ->where('detail_id', $request->detail_id ?? null)
                ->first();

            // Azaldılacaq miqdarın hesablanması
            $decrementAmount = 0;

            if ($request->detail_id) {
                // Detail mövcuddursa, unit ilə quantity-ni vururuq
                $detail = StockDetail::find($request->detail_id);

                if (!$detail) {
                    return response()->json(['error' => 'Detail tapılmadı.'], 404);
                }

                $decrementAmount = $request->quantity * $detail->count;
            } else {
                // Detail mövcud deyilsə, sadəcə quantity qədər azaldırıq
                $decrementAmount = $request->quantity;
            }

            // Stok miqdarını azaldırıq
            $stock->decrement('amount', $decrementAmount);

            if ($existingStock) {
                // Mövcud qeydin quantity-si artırılır
                $existingStock->pivot->quantity += $request->quantity;
                $existingStock->pivot->save();
            } else {
                // Yeni stok əlavə edilir
                $order->stocks()->attach($request->stock_id, [
                    'quantity' => $request->quantity,
                    'detail_id' => $request->detail_id, // Detail əlavə edirik
                ]);
            }

            DB::commit();

            return response()->json($order->load('stocks'), 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error adding stock to order', 'error' => $e->getMessage()], 500);
        }
    }


    public function subtractStock(AddStockToOrderRequest $request, $quickOrderId)
    {
        $restaurantId = $request->user()->restaurant_id; // Get restaurant ID of the authenticated user

        // Find the QuickOrder in the user's restaurant
        $quickOrder = QuickOrder::where('restaurant_id', $restaurantId)->findOrFail($quickOrderId);

        if ($quickOrder->order->status !== 'approved') {
            return response()->json(['message' => 'Order status is not approved.'], 403);
        }

        DB::beginTransaction();

        try {
            $order = $quickOrder->order;

            // Find the stock in the order
            $existingPivot = DB::table('order_stock')
                ->where('id', $request->pivotId)
                ->first();

            // Stock modelindən məlumat əldə edilir
            $stock = Stock::where('id', $request->stock_id)
                ->where('restaurant_id', $restaurantId)
                ->first();

            if (!$stock) {
                return response()->json(['error' => 'Stock not found.'], 404);
            }

            if (!$existingPivot) {
                return response()->json(['error' => 'Stock does not exist in the order.'], 404);
            }

            // Calculate the increment amount
            $incrementAmount = 0;

            if ($existingPivot->detail_id) {
                // If detail exists, calculate increment amount using its count
                $detail = StockDetail::find($existingPivot->detail_id);

                if (!$detail) {
                    return response()->json(['error' => 'Detail not found.'], 404);
                }

                $incrementAmount = $detail->count;
            } else {
                // If no detail, increment by 1
                $incrementAmount = 1;
            }

            // Increase the stock amount back
            $stock->increment('amount', $incrementAmount);

            // Subtract or update the pivot quantity
            if ($request->increase) {
                // If `increase` is true, reduce the quantity by 1
                if ($existingPivot->quantity > 1) {
                    DB::table('order_stock')
                        ->where('id', $existingPivot->id)
                        ->update(['quantity' => $existingPivot->quantity - 1]);
                } else {
                    // If quantity is 1, remove the pivot
                    DB::table('order_stock')
                        ->where('id', $existingPivot->id)
                        ->delete();
                }
            } else {
                // Subtract the specified quantity from the pivot
                $newQuantity = $existingPivot->quantity - $request->quantity;

                if ($newQuantity <= 0) {
                    // If quantity becomes zero or less, remove the pivot
                    DB::table('order_stock')->where('id', $existingPivot->id)->delete();
                } else {
                    // Update the pivot quantity
                    DB::table('order_stock')
                        ->where('id', $existingPivot->id)
                        ->update(['quantity' => $newQuantity]);
                }
            }

            DB::commit();

            return response()->json($order->load('stocks'), 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Error subtracting stock from order', 'error' => $e->getMessage()], 500);
        }
    }


}
