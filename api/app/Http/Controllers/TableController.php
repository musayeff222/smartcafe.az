<?php

namespace App\Http\Controllers;

use App\Http\Requests\TableRequest;
use App\Models\StockDetail;
use App\Models\Table;
use App\Models\StockSet;
use Illuminate\Http\Request;
use App\Http\Requests\AddStockToOrderRequest;
use App\Models\Order;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\ChangeTableRequest;
use App\Http\Requests\CreateQrOrderRequest;
use App\Models\TableOrder;
// use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
// use SimpleSoftwareIO\QrCode\Facades\QrCode;

class TableController extends Controller
{
    public function index(Request $request)
    {
        // Get tables for the authenticated user's restaurant
        $restaurant = $request->user()->restaurant;

        $tableGroupId = $request->query('table_group_id');

        // Query the tables based on the restaurant and optionally filter by table_group_id
        $query = Table::where('restaurant_id', $restaurant->id);


        if ($tableGroupId) {
            $query->where('table_group_id', $tableGroupId);
        }

        $query = $query
            ->select('tables.*')
            ->selectSub(function ($query) {
                $query->from('table_orders')
                    ->join('orders', 'table_orders.order_id', '=', 'orders.id')
                    ->where('orders.status', 'approved')
                    ->whereColumn('table_orders.table_id', 'tables.id')
                    ->selectRaw('CASE
            WHEN COUNT(*) = 0 THEN 1
            ELSE 0
        END');
            }, 'is_available') // If count is 0, table is available
            // Subquery to get the `book_time`
            ->selectSub(function ($query) {
                $query->from('table_orders')
                    ->join('orders', 'table_orders.order_id', '=', 'orders.id')
                    ->where('orders.status', 'approved')
                    ->whereColumn('table_orders.table_id', 'tables.id')
                    ->orderBy('table_orders.created_at', 'desc')
                    ->limit(1)
                    ->selectRaw("DATE_FORMAT(table_orders.created_at, '%H:%i')");
            }, 'book_time')
            // Subquery to get the `user_name`
            ->selectSub(function ($query) {
                $query->from('table_orders')
                    ->join('orders', 'table_orders.order_id', '=', 'orders.id')
                    ->join('users', 'orders.user_id', '=', 'users.id') // Left join with `users` table to handle null
                    ->where('orders.status', 'approved')
                    ->whereColumn('table_orders.table_id', 'tables.id')
                    ->orderBy('table_orders.created_at', 'desc')
                    ->limit(1)
                    ->selectRaw("COALESCE(users.name, 'No User')");
            }, 'user_name')
            // Subquery to calculate `total_price` including details

            ->selectSub(function ($query) {
                $query->selectRaw('
        (
            SELECT
                COALESCE((
                    SELECT SUM(
                        CASE
                            WHEN sd.price IS NOT NULL THEN sd.price * os.quantity
                            ELSE s.price * os.quantity
                        END
                    )
                    FROM order_stock os
                    LEFT JOIN stock_details sd ON os.detail_id = sd.id
                    LEFT JOIN stocks s ON os.stock_id = s.id
                    WHERE os.order_id = orders.id
                ), 0) +
                COALESCE((
                    SELECT SUM(oss.price * oss.quantity)
                    FROM order_stock_sets oss
                    WHERE oss.order_id = orders.id
                ), 0) +
                COALESCE((
                    SELECT SUM(tc.amount)
                    FROM time_charges tc
                    WHERE tc.order_id = orders.id
                ), 0)
            FROM orders
            INNER JOIN table_orders ON table_orders.order_id = orders.id
            WHERE orders.status = "approved"
              AND table_orders.table_id = tables.id
            ORDER BY table_orders.created_at DESC
            LIMIT 1
        )
    ');
            }, 'total_price');


//            ->selectSub(function ($query) {
//                $query->selectRaw('
//        (
//            SELECT
//                COALESCE((
//                    SELECT SUM(
//                        CASE
//                            WHEN sd.price IS NOT NULL THEN sd.price * os.quantity
//                            ELSE s.price * os.quantity
//                        END
//                    )
//                    FROM order_stock os
//                    LEFT JOIN stock_details sd ON os.detail_id = sd.id
//                    LEFT JOIN stocks s ON os.stock_id = s.id
//                    WHERE os.order_id = orders.id
//                ), 0) +
//                COALESCE((
//                    SELECT SUM(oss.price * oss.quantity)
//                    FROM order_stock_sets oss
//                    WHERE oss.order_id = orders.id
//                ), 0)
//            FROM orders
//            INNER JOIN table_orders ON table_orders.order_id = orders.id
//            WHERE orders.status = "approved"
//            AND table_orders.table_id = tables.id
//            ORDER BY table_orders.created_at DESC
//            LIMIT 1
//        )
//    ');
//            }, 'total_price');




        if ($request->has('is_available') && in_array($request->is_available, ['0', '1'])) {
            $query->having('is_available', $request->is_available);
        }

        $tables = $query->get();


        return response()->json([
            'tables' => $tables,
            'empty_table_color' => $restaurant->empty_table_color,
            'booked_table_color' => $restaurant->booked_table_color,
        ]);
    }


    public function store(TableRequest $request)
    {
        $data = $request->validated();
        $uniqueUrl = Str::uuid();

        // $qrCode = QrCode::format('png')->size(300)->generate($uniqueUrl);
        // $qrImagePath = 'qr_images/' . Str::random(10) . '.png';
        // Storage::disk('public')->put($qrImagePath, $qrCode);

        // $data['qr_image'] = $qrImagePath;
        $data['unique_url'] = $uniqueUrl;

        $data['restaurant_id'] = $request->user()->restaurant_id;

        $table = Table::create($data);

        return response()->json($table, 201);
    }

    public function update(TableRequest $request, $id)
    {
        $table = Table::findOrFail($id);

        if ($table->restaurant_id != $request->user()->restaurant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $table->update($request->validated());

        return response()->json($table);
    }

    public function show(Request $request, $id)
    {
        $table = Table::where('restaurant_id', $request->user()->restaurant_id)->findOrFail($id);
        return response()->json($table);
    }

    public function destroy(Request $request, $id)
    {
        $table = Table::findOrFail($id);

        if ($table->restaurant_id != $request->user()->restaurant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $table->delete();

        return response()->json(['message' => 'Table deleted successfully']);
    }

    public function addStockToOrder(AddStockToOrderRequest $request, $tableId)
    {
        DB::beginTransaction();

        try {
            $table = Table::where('restaurant_id', $request->user()->restaurant_id)->find($tableId);

            if (!$table) {
                return response()->json(['error' => 'Masa tapılmadı.'], 404);
            }

            $tableOrder = $table->tableOrders()
                ->whereHas('order', function ($query) {
                    $query->where('status', 'approved');
                })
                ->first();

            if (!$tableOrder) {
                $newOrder = Order::create([
                    'restaurant_id' => $table->restaurant_id,
                    'status' => 'approved',
                    'user_id' => $request->user()->id,
                ]);

                $tableOrder = $table->tableOrders()->create([
                    'order_id' => $newOrder->id,
                    'restaurant_id' => $table->restaurant_id,
                ]);
            }

            // Əvvəlcə adi stok axtar
            $stock = Stock::where('id', $request->stock_id)
                ->where('restaurant_id', $table->restaurant_id)
                ->first();


            if ($stock) {
                // Normal stok işlənməsi
                $decrementAmount = 0;

                if ($request->detail_id) {
                    $detail = StockDetail::find($request->detail_id);
                    if (!$detail) {
                        return response()->json(['error' => 'Detail tapılmadı.'], 404);
                    }

                    $decrementAmount = $request->quantity * $detail->count;
                } else {
                    $decrementAmount = $request->quantity;
                }

                $stock->decrement('amount', $decrementAmount);

                $existingPivot = DB::table('order_stock')
                    ->where('order_id', $tableOrder->order->id)
                    ->where('stock_id', $request->stock_id)
                    ->where('detail_id', $request->detail_id ?? null)
                    ->first();



                if ($existingPivot) {
                    DB::table('order_stock')
                        ->where('id', $existingPivot->id)
                        ->update([
                            'quantity' => $existingPivot->quantity + $request->quantity,
                        ]);
                } else {
                    $tableOrder->order->stocks()->attach($request->stock_id, [
                        'quantity' => $request->quantity,
                        'detail_id' => $request->detail_id,
                    ]);
                }

                $stock->load('rawMaterials');
                $this->adjustRawMaterials($stock, $request->quantity);

                DB::commit();
                return response()->json($tableOrder->order->load('stocks'));
            }

            // Əgər stok tapılmadısa, bəlkə bu StockSet-dir
            $stockSet = DB::table('stock_sets')
                ->where('id', $request->stock_id)
                ->first();

            if (!$stockSet) {
                return response()->json(['error' => 'Stok və ya Set tapılmadı.'], 404);
            }
            // StockSet içindəki stock-ları əldə et və raw_material-ları tənzimlə
            $setStocks = DB::table('stock_set_items')
                ->where('stock_set_id', $stockSet->id)
                ->get();

            foreach ($setStocks as $setStock) {
                $stock = Stock::find($setStock->stock_id);
                if ($stock) {
                    $totalQuantity = $request->quantity * $setStock->quantity;
                    $stock->decrement('amount', $totalQuantity);

                    $stock->load('rawMaterials');

                    $this->adjustRawMaterials($stock, $totalQuantity);
                    if ($stock->rawMaterials->isNotEmpty()){
                    }
                }
            }
            $existingSet = DB::table('order_stock_sets')
                ->where('order_id', $tableOrder->order->id)
                ->where('stock_set_id', $stockSet->id)
                ->first();

            if ($existingSet) {
                DB::table('order_stock_sets')
                    ->where('id', $existingSet->id)
                    ->update([
                        'quantity' => $existingSet->quantity + $request->quantity,
                    ]);
            } else {
                DB::table('order_stock_sets')->insert([
                    'order_id' => $tableOrder->order->id,
                    'stock_set_id' => $stockSet->id,
                    'price' => $stockSet->price,
                    'quantity' => $request->quantity,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();
            return response()->json([
                'message' => 'Stock Set uğurla əlavə olundu',
                'stock_set' => $stockSet,
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Əlavə edilə bilmədi: ' . $e->getMessage()], 500);
        }
    }



    public function subtractStockFromOrder(AddStockToOrderRequest $request, $tableId)
    {
        DB::beginTransaction();

        try {
            $table = Table::where('restaurant_id', $request->user()->restaurant_id)->find($tableId);

            if (!$table) {
                return response()->json(['error' => 'Masa tapılmadı.'], 404);
            }

            $tableOrder = $table->tableOrders()
                ->whereHas('order', function ($query) {
                    $query->where('status', 'approved');
                })
                ->first();

            if (!$tableOrder) {
                return response()->json(['error' => 'Bu masada təsdiqlənmiş sifariş yoxdur.'], 404);
            }

            // 1. Əvvəlcə Stock tapmağa cəhd et
            $existingPivot = DB::table('order_stock')
                ->where('id', $request->pivotId)
                ->first();

            $stock = Stock::where('id', $request->stock_id)
                ->where('restaurant_id', $table->restaurant_id)
                ->first();

            if ($stock && $existingPivot) {
                $incrementAmount = 0;

                if ($existingPivot->detail_id) {
                    $detail = StockDetail::find($existingPivot->detail_id);
                    if (!$detail) {
                        return response()->json(['error' => 'Detail tapılmadı.'], 404);
                    }
                    $incrementAmount = $detail->count * $request->quantity;
                } else {
                    $incrementAmount = 1 * $request->quantity;
                }

                // Stok miqdarını artır
                $stock->increment('amount', $incrementAmount);

                $newQuantity = $existingPivot->quantity - $request->quantity;

                if ($newQuantity > 0) {
                    DB::table('order_stock')
                        ->where('id', $existingPivot->id)
                        ->update(['quantity' => $newQuantity]);
                } else {
                    DB::table('order_stock')
                        ->where('id', $existingPivot->id)
                        ->delete();
                }

                $stock->load('rawMaterials');
                $this->adjustRawMaterials($stock, $request->quantity, true);

                DB::commit();
                return response()->json($tableOrder->order->load('stocks'));
            }

            // 2. Stock tapılmadısa, StockSet-ə baxırıq
            $stockSet = DB::table('stock_sets')->where('id', $request->stock_id)->first();
            if ($stockSet) {
                $existingSet = DB::table('order_stock_sets')
                    ->where('order_id', $tableOrder->order->id)
                    ->where('stock_set_id', $stockSet->id)
                    ->first();

                if (!$existingSet) {
                    return response()->json(['error' => 'Sifariş üçün uyğun StockSet tapılmadı.'], 404);
                }

                // StockSet-in daxilindəki stock-ları geri qaytar
                $setStocks = DB::table('stock_set_items')
                    ->where('stock_set_id', $stockSet->id)
                    ->get();

                foreach ($setStocks as $setStock) {
                    $stock = Stock::find($setStock->stock_id);
                    if ($stock) {
                        $totalQuantity = $request->quantity * $setStock->quantity;
                        $stock->increment('amount', $totalQuantity);

                        $stock->load('rawMaterials');
                        $this->adjustRawMaterials($stock, $totalQuantity, true); // true = geri artır
                    }
                }

                $newQuantity = $existingSet->quantity - $request->quantity;

                if ($newQuantity > 0) {
                    DB::table('order_stock_sets')
                        ->where('id', $existingSet->id)
                        ->update(['quantity' => $newQuantity]);
                } else {
                    DB::table('order_stock_sets')
                        ->where('id', $existingSet->id)
                        ->delete();
                }

                DB::commit();
                return response()->json([
                    'message' => 'Stock Set sifarişdən çıxarıldı və ya azaldıldı',
                    'stock_set' => $stockSet,
                ]);
            }

            return response()->json(['error' => 'Stok və ya Stock Set tapılmadı.'], 404);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Stok/Stock Set sifarişdən çıxarıla bilmədi. ' . $e->getMessage()], 500);
        }
    }


    public function getTableWithApprovedOrders(Request $request, $tableId)
    {
        $table = Table::where('restaurant_id', $request->user()->restaurant_id)
            ->find($tableId);

        if (!$table) {
            return response()->json(['error' => 'Table not found.'], 404);
        }

        $tableWithApprovedOrders = $table->load([
            'tableOrders' => function ($query) {
                $query->whereHas('order', function ($query) {
                    $query->where('status', 'approved');
                })->with([
                    'order.stocks' => function ($query) {
                        $query->with('details')->withPivot(['id', 'detail_id', 'quantity']);
                    },
                    'order.stockSets.stockSetItems.stock', // stock_set_items içindəki stock-ları da çəkirik
                    'order.prepayments'
                ]);
            }
        ]);

        $t = [
            'name' => $tableWithApprovedOrders->name,
            'id' => $tableWithApprovedOrders->id,
            'orders' => $tableWithApprovedOrders->tableOrders->map(function ($tableOrder) {
                return [
                    'order_id' => $tableOrder->order->id,
                    'status' => $tableOrder->order->status,

                    // Adi məhsullar
                    'stocks' => $tableOrder->order->stocks->map(function ($stock) {
                        $selectedDetail = $stock->pivot->detail_id
                            ? $stock->details->firstWhere('id', $stock->pivot->detail_id)
                            : null;

                        return [
                            'pivot_id' => $stock->pivot->id,
                            'pivot' => $stock->pivot,
                            'id' => $stock->id,
                            'name' => $stock->name,
                            'quantity' => $stock->pivot->quantity,
                            'price' => $selectedDetail
                                ? ($selectedDetail->price * $stock->pivot->quantity)
                                : ($stock->price * $stock->pivot->quantity),
                            'detail_id' => $selectedDetail ? $selectedDetail->id : null,
                            'detail' => $selectedDetail ? [
                                'id' => $selectedDetail->id,
                                'price' => $selectedDetail->price,
                                'unit' => $selectedDetail->unit,
                                'count' => $selectedDetail->count,
                            ] : null,
                        ];
                    }),

                    // Set məhsullar
                    'sets' => $tableOrder->order->stockSets->map(function ($set) {
                        return [
                            'pivot_id' => $set->pivot->id,
                            'id' => $set->id,
                            'name' => $set->name,
                            'quantity' => $set->pivot->quantity,
                            'price' => $set->pivot->price * $set->pivot->quantity,
                            'pivot' => $set->pivot,
                            'items' => $set->stockSetItems->map(function ($item) {
                                return [
                                    'stock_id' => $item->stock->id,
                                    'stock_name' => $item->stock->name,
                                    'quantity' => $item->quantity,
                                ];
                            }),
                        ];
                    }),

                    'prepayments' => $tableOrder->order->prepayments,
                    'total_prepayment' => $tableOrder->order->totalPrepayments(),

                    // Cəmi qiymət
                    'total_price' =>
                        $tableOrder->order->stocks->sum(function ($stock) {
                            $selectedDetail = $stock->pivot->detail_id
                                ? $stock->details->firstWhere('id', $stock->pivot->detail_id)
                                : null;

                            return $selectedDetail
                                ? ($selectedDetail->price * $stock->pivot->quantity)
                                : ($stock->price * $stock->pivot->quantity);
                        }) +
                        $tableOrder->order->stockSets->sum(function ($set) {
                            return $set->pivot->price * $set->pivot->quantity;
                        }),
                ];
            }),
        ];

        return response()->json(['table' => $t]);
    }





    public function cancelOrder(Request $request, $tableId)
    {
        DB::beginTransaction();

        try {
            // Ensure the table belongs to the user's restaurant
            $table = Table::where('restaurant_id', $request->user()->restaurant_id)->find($tableId);

            // If the table is not found, return a 404 Not Found response
            if (!$table) {
                return response()->json(['error' => 'Table not found.'], 404);
            }

            // Check if there is an approved order for the table
            $tableOrder = $table->tableOrders()
                ->whereHas('order', function ($query) {
                    $query->where('status', 'approved');
                })
                ->first();

            // If no approved order exists, return a 404 Not Found response
            if (!$tableOrder) {
                return response()->json(['error' => 'No approved order found for this table.'], 404);
            }

            // Cancel the order by setting the status to 'canceled'
            $tableOrder->order->update(['status' => 'canceled']);

            // Commit the transaction
            DB::commit();

            return response()->json(['message' => 'Order cancelled successfully']);
        } catch (\Exception $e) {
            // Rollback the transaction in case of an error
            DB::rollback();
            return response()->json(['error' => 'Failed to cancel order. ' . $e->getMessage()], 500);
        }
    }

    public function changeTables(ChangeTableRequest $request, $tableId)
    {
        $table = Table::where('restaurant_id', $request->user()->restaurant_id)->find($tableId);

        if (!$table) {
            return response()->json(['error' => 'Table not found.'], 404);
        }

        if ($table->isAvailable()) {
            return response()->json(['error' => 'Table is available.'], 400);
        }

        $newTable = Table::where('restaurant_id', $request->user()->restaurant_id)->find($request->table_id);

        if (!$newTable) {
            return response()->json(['error' => 'New table not found.'], 404);
        }

        if (!$newTable->isAvailable()) {
            return response()->json(['error' => 'New table is not available.'], 400);
        }

        $table->tableOrders()->update(['table_id' => $newTable->id]);


        return response()->json($newTable);
    }

    public function mergeTables(Request $request, $sourceTableId)
    {
        // Start transaction to ensure atomicity
        DB::beginTransaction();

        try {
            // Fetch the source and destination tables
            $restaurantId = $request->user()->restaurant_id;
            $sourceTable = Table::where('restaurant_id', $restaurantId)->findOrFail($sourceTableId);
            $destinationTable = Table::where('restaurant_id', $restaurantId)->findOrFail($request->table_id);

            // Fetch approved orders for both tables
            $sourceOrder = $sourceTable->tableOrders()
                ->whereHas('order', function ($query) {
                    $query->where('status', 'approved');
                })->first();

            $destinationOrder = $destinationTable->tableOrders()
                ->whereHas('order', function ($query) {
                    $query->where('status', 'approved');
                })->first();

            if (!$sourceOrder || !$destinationOrder) {
                return response()->json(['message' => 'Both tables must have an approved order to merge.'], 400);
            }

            // Loop through stocks in the source order and add them to the destination order
            foreach ($sourceOrder->order->stocks as $stock) {
                $existingStock = $destinationOrder->order->stocks()->where('stock_id', $stock->id)->first();

                if ($existingStock) {
                    // If the stock exists, increase the quantity
                    $destinationOrder->order->stocks()->updateExistingPivot($stock->id, [
                        'quantity' => $existingStock->pivot->quantity + $stock->pivot->quantity,
                    ]);
                } else {
                    // Otherwise, attach the stock to the destination order
                    $destinationOrder->order->stocks()->attach($stock->id, [
                        'quantity' => $stock->pivot->quantity,
                    ]);
                }
            }

            // Remove all stocks from the source order after merging
            $sourceOrder->order->update(['status' => 'canceled']);

            DB::commit();

            return response()->json(['message' => 'Tables merged successfully.', 'order' => $destinationOrder->order->load('stocks')]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error merging tables.', 'error' => $e->getMessage()], 500);
        }
    }

    public function generateQrCode(Request $request, $id)
    {
        $table = Table::where('restaurant_id', $request->user()->restaurant_id)->findOrFail($id);

        if (!$table) {
            return response()->json(['error' => 'Table not found.'], 404);
        }

        $uniqueUrl = Str::uuid();

        // $qrCode = QrCode::format('png')->size(300)->generate($uniqueUrl);
        // $qrImagePath = 'qr_images/' . Str::random(10) . '.png';
        // Storage::disk('public')->put($qrImagePath, $qrCode);

        $table->update([
            // 'qr_image' => $qrImagePath,
            'unique_url' => $uniqueUrl,
        ]);


        return response($uniqueUrl);
    }

    public function getQrCode(Request $request, $id)
    {
        $table = Table::where('restaurant_id', $request->user()->restaurant_id)->findOrFail($id);

        if (!$table) {
            return response()->json(['error' => 'Table not found.'], 404);
        }



        return response($table->unique_url);
    }

    public function getTableByQrCode(Request $request, $uniqueUrl)
    {
        $table = Table::where('unique_url', $uniqueUrl)
            ->with([
                'tableOrders' => function ($query) {
                    $query->whereHas('order', function ($query) {
                        $query->whereIn('status', ['approved', 'pending_approval']);
                    })
                        ->with([
                            'order.stocks' => function ($query) {
                                $query->with('details'); // **Stock-un detallarını yükləyirik**
                            },
                            'order.prepayments'
                        ]);
                }
            ])
            ->first();

        if (!$table) {
            return response()->json(['error' => 'Table not found.'], 404);
        }

        // Helper function to transform orders
        $transformOrder = function ($tableOrder) {
            $order = $tableOrder->order;

            $stocks = $order->stocks->map(function ($stock) {
                // **Əgər pivot->detail_id varsa, yalnız həmin detail-in qiymətini götürürük**
                $selectedDetail = $stock->pivot->detail_id
                    ? $stock->details->firstWhere('id', $stock->pivot->detail_id)
                    : null;

                $pricePerUnit = $selectedDetail ? $selectedDetail->price : $stock->price;
                $totalStockPrice = $pricePerUnit * $stock->pivot->quantity;

                return [
                    'id' => $stock->id,
                    'name' => $stock->name,
                    'quantity' => $stock->pivot->quantity,
                    'unit_price' => $pricePerUnit,
                    'total_price' => $totalStockPrice, // **Cəmi qiymət**
                    'detail' => $selectedDetail ? [
                        'id' => $selectedDetail->id,
                        'price' => $selectedDetail->price,
                        'unit' => $selectedDetail->unit,
                        'count' => $selectedDetail->count,
                    ] : null, // **Əgər `detail_id` yoxdursa, `null` qaytarılır**
                ];
            });

            return [
                'order_id' => $order->id,
                'status' => $order->status,
                'stocks' => $stocks,
                'prepayments' => $order->prepayments,
                'total_prepayment' => $order->totalPrepayments(),
                'total_price' => $stocks->sum(fn($stock) => $stock['total_price']), // **Düzgün cəmi qiymət**
            ];
        };

        // Separate approved and pending approval orders
        $approvedOrders = $table->tableOrders->where('order.status', 'approved')->map($transformOrder);
        $pendingApprovalOrders = $table->tableOrders->where('order.status', 'pending_approval')->map($transformOrder);

        return response()->json([
            'table' => [
                'name' => $table->name,
                'id' => $table->id,
                'orders' => [
                    'approved' => [
                        'orders' => $approvedOrders,
                        'total_price' => $approvedOrders->sum(fn($order) => $order['total_price']),
                    ],
                    'pending_approval' => [
                        'orders' => array_values($pendingApprovalOrders->toArray()),
                        'total_price' => $pendingApprovalOrders->sum(fn($order) => $order['total_price']),
                    ],
                ]
            ]
        ]);
    }






    public function getOrderByQrCode(Request $request, $uniqueUrl)
    {
        $table = Table::where('unique_url', $uniqueUrl)->first();

        if (!$table) {
            return response()->json(['error' => 'Table not found.'], 404);
        }

        $tableWithApprovedOrders = $table
            ->load([
                'tableOrders' => function ($query) {
                    // Only load tableOrders that have an associated approved order
                    $query->whereHas('order', function ($query) {
                        $query->where('status', 'approved');
                    })
                        ->with('order.stocks')
                        ->with('order.prepayments'); // Eager load stocks for the orders
                }
            ]);

        $t = [
            'name' => $tableWithApprovedOrders->name,
            'id' => $tableWithApprovedOrders->id,
            'orders' => $tableWithApprovedOrders->tableOrders->map(function ($tableOrder) {
                return [
                    'order_id' => $tableOrder->order->id,
                    'status' => $tableOrder->order->status,
                    'stocks' => $tableOrder->order->stocks->map(function ($stock) {
                        return [
                            'id' => $stock->id,
                            'name' => $stock->name,
                            'quantity' => $stock->pivot->quantity,
                            'price' => $stock->price * $stock->pivot->quantity,
                        ];
                    }),
                    'prepayments' => $tableOrder->order->prepayments,
                    'total_prepayment' => $tableOrder->order->totalPrepayments(),
                    'total_price' => $tableOrder->order->stocks->sum(function ($stock) {
                        return $stock->price * $stock->pivot->quantity;
                    }),
                ];
            }),
        ];

        return response()->json([
            'table' => $t,
        ]);
    }


    public function createQrOrder(CreateQrOrderRequest $request, $uniqueUrl)
    {
        $table = Table::where('unique_url', $uniqueUrl)->first();

        if (!$table) {
            return response()->json(['error' => 'Table not found.'], 404);
        }

        if (!$table->restaurant->is_qr_active || !$table->restaurant->get_qr_order) {
            return response()->json(['error' => 'QR menu is not active.'], 400);
        }

        $data = $request->validated();

        DB::beginTransaction();
        try {
            $order = Order::create([
                'restaurant_id' => $table->restaurant_id,
                'status' => 'pending_approval',
            ]);

            $table->tableOrders()->create([
                'order_id' => $order->id,
                'restaurant_id' => $table->restaurant_id,
            ]);

            // 🔹 1. Adi məhsullar
            if (!empty($data['stocks'])) {
                foreach ($data['stocks'] as $stockData) {
                    $stock = Stock::where('restaurant_id', $table->restaurant_id)
                        ->where('show_on_qr', true)
                        ->find($stockData['stock_id']);

                    if (!$stock) {
                        return response()->json(['error' => 'Stock not found.'], 404);
                    }

                    $quantity = $stockData['quantity'] ?? 1;
                    $detailId = $stockData['detail_id'] ?? null;

                    if ($detailId) {
                        $selectedDetail = StockDetail::where('id', $detailId)
                            ->where('stock_id', $stock->id)
                            ->first();

                        if (!$selectedDetail) {
                            return response()->json(['error' => 'Invalid detail_id for stock.'], 400);
                        }
                    }

                    $order->stocks()->attach($stock->id, [
                        'quantity' => $quantity,
                        'detail_id' => $detailId,
                    ]);
                }
            }
            // 🔹 2. Set məhsulları (əgər varsa)
            if (!empty($data['stock_sets'])) {
                foreach ($data['stock_sets'] as $setData) {
                    $stockSet = StockSet::find($setData['stock_set_id']);


                    if (!$stockSet) {
                        return response()->json(['error' => 'Stock set not found.'], 404);
                    }

                    $quantity = $setData['quantity'] ?? 1;
                    $price = $stockSet->price ?? $stockSet->calculatePrice(); // fallback

                    $order->stockSets()->attach($stockSet->id, [
                        'quantity' => $quantity,
                        'price' => $price,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'id' => $order->id,
                'status' => $order->status,

                // ✅ Adi stoklar cavabda
                'stocks' => $order->stocks->map(function ($stock) {
                    $selectedDetail = $stock->pivot->detail_id
                        ? StockDetail::find($stock->pivot->detail_id)
                        : null;

                    return [
                        'id' => $stock->id,
                        'name' => $stock->name,
                        'image' => $stock->image,
                        'price' => $selectedDetail ? $selectedDetail->price : $stock->price,
                        'quantity' => $stock->pivot->quantity,
                        'detail' => $selectedDetail ? [
                            'id' => $selectedDetail->id,
                            'price' => $selectedDetail->price,
                            'unit' => $selectedDetail->unit,
                            'count' => $selectedDetail->count,
                        ] : null,
                    ];
                }),

                // ✅ Setlər cavabda
                'stock_sets' => $order->stockSets->map(function ($set) {
                    return [
                        'id' => $set->id,
                        'name' => $set->name,
                        'unit_price' => $set->pivot->price,
                        'quantity' => $set->pivot->quantity,
                        'price' => $set->pivot->price * $set->pivot->quantity,
                        'components' => $set->stockSetItems->map(function ($item) use ($set) {
                            return [
                                'name' => $item->stock->name ?? 'unknown',
                                'quantity' => $item->quantity * $set->pivot->quantity,
                            ];
                        }),
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to create order. ' . $e->getMessage()], 500);
        }
    }


    public function getQrMenu(Request $request, $uniqueUrl)
    {
        $table = Table::where('unique_url', $uniqueUrl)->first();

        if (!$table) {
            return response()->json(['error' => 'Table not found.'], 404);
        }

        $restaurant = $table->restaurant;

        if (!$restaurant->is_qr_active) {
            return response()->json(['error' => 'QR menu is not active.', 'restaurant' => $restaurant], 400);
        }

        $stockGroups = $restaurant->stockGroups()
            ->where('show_on_qr_menu', true)
            ->with(['stocks' => function ($query) {
                $query->where('show_on_qr', true)->with('details'); // Eager load stock details
            }])->get();

        // Format the response to include stock images
        $formattedStockGroups = $stockGroups->map(function ($group) {
            return [
                'id' => $group->id,
                'name' => $group->name,
                'stocks' => $group->stocks->map(function ($stock) {
                    return [
                        'id' => $stock->id,
                        'name' => $stock->name,
                        'image' => $stock->image, // Ensure image field is included
                        'unit' => $stock->unit,
                        'price' => $stock->price,
                        'details' => $stock->details->map(function ($detail) {
                            return [
                                'id' => $detail->id,
                                'stock_id' => $detail->stock_id,
                                'price' => $detail->price,
                                'unit' => $detail->unit,
                                'count' => $detail->count,
                                'created_at' => $detail->created_at,
                                'updated_at' => $detail->updated_at,
                            ];
                        }),
                    ];
                }),
            ];
        });

        return response()->json([
            'stockGroups' => $formattedStockGroups,
            'restaurant' => $restaurant,
            'table' => $table,
        ]);
    }



    public function getPendingApprovalOrders(Request $request)
    {
        $restaurant = $request->user()->restaurant;

        $tables = Table::where('restaurant_id', $restaurant->id)
            ->with([
                'tableOrders' => function ($query) {
                    $query->whereHas('order', function ($query) {
                        $query->where('status', 'pending_approval');
                    })->with([
                        'order.stocks' => function ($query) {
                            $query->with('details');
                        },
                        'order.stockSets.stocks', // Setin içindəki məhsullar üçün
                        'order.prepayments',
                    ]);
                }
            ])
            ->whereHas('tableOrders', function ($query) {
                $query->whereHas('order', function ($query) {
                    $query->where('status', 'pending_approval');
                });
            })
            ->get();

        $formattedTables = $tables->map(function ($table) {
            return [
                'id' => $table->id,
                'unique_url' => $table->unique_url,
                'qr_image' => $table->qr_image,
                'restaurant_id' => $table->restaurant_id,
                'table_group_id' => $table->table_group_id,
                'name' => $table->name,
                'created_at' => $table->created_at,
                'updated_at' => $table->updated_at,
                'table_orders' => $table->tableOrders->map(function ($tableOrder) {
                    $order = $tableOrder->order;

                    if (!$order) {
                        return [
                            'id' => $tableOrder->id,
                            'table_id' => $tableOrder->table_id,
                            'restaurant_id' => $tableOrder->restaurant_id,
                            'order_id' => null,
                            'created_at' => $tableOrder->created_at,
                            'updated_at' => $tableOrder->updated_at,
                            'order' => null,
                        ];
                    }

                    return [
                        'id' => $tableOrder->id,
                        'table_id' => $tableOrder->table_id,
                        'restaurant_id' => $tableOrder->restaurant_id,
                        'order_id' => $order->id,
                        'created_at' => $tableOrder->created_at,
                        'updated_at' => $tableOrder->updated_at,
                        'order' => [
                            'id' => $order->id,
                            'restaurant_id' => $order->restaurant_id,
                            'status' => $order->status,
                            'created_at' => $order->created_at,
                            'updated_at' => $order->updated_at,
                            'user_id' => $order->user_id,

                            // Adi məhsullar
                            'stocks' => $order->stocks->map(function ($stock) {
                                $selectedDetail = $stock->pivot->detail_id
                                    ? $stock->details->where('id', $stock->pivot->detail_id)->first()
                                    : null;

                                return [
                                    'id' => $stock->id,
                                    'restaurant_id' => $stock->restaurant_id,
                                    'stock_group_id' => $stock->stock_group_id,
                                    'name' => $stock->name,
                                    'image' => $stock->image,
                                    'show_on_qr' => $stock->show_on_qr,
                                    'price' => $selectedDetail ? $selectedDetail->price : $stock->price,
                                    'amount' => $stock->amount,
                                    'critical_amount' => $stock->critical_amount,
                                    'alert_critical' => $stock->alert_critical,
                                    'order_start' => $stock->order_start,
                                    'order_stop' => $stock->order_stop,
                                    'created_at' => $stock->created_at,
                                    'updated_at' => $stock->updated_at,
                                    'description' => $stock->description,
                                    'pivot' => [
                                        'stock_id' => $stock->id,
                                        'id' => $stock->pivot->id,
                                        'quantity' => $stock->pivot->quantity,
                                        'detail_id' => $stock->pivot->detail_id,
                                        'created_at' => $stock->pivot->created_at,
                                        'updated_at' => $stock->pivot->updated_at,
                                    ],
                                    'detail' => $selectedDetail ? [
                                        'id' => $selectedDetail->id,
                                        'price' => $selectedDetail->price,
                                        'unit' => $selectedDetail->unit,
                                        'count' => $selectedDetail->count,
                                    ] : null,
                                ];
                            }),

                            // Setlər və içindəkilər
                            'stock_sets' => $order->stockSets->map(function ($set) {
                                return [
                                    'id' => $set->id,
                                    'name' => $set->name,
                                    'price' => $set->pivot->price * $set->pivot->quantity,
                                    'unit_price' => $set->pivot->price,
                                    'quantity' => $set->pivot->quantity,
                                    'pivot' => [
                                        'id' => $set->pivot->id ?? null,
                                        'price' => $set->pivot->price,
                                        'quantity' => $set->pivot->quantity,
                                    ],
                                    'components' => $set->stockSetItems->map(function ($item) use ($set) {
                                        return [
                                            'name' => $item->stock->name ?? 'unknown',
                                            'quantity' => $item->quantity * $set->pivot->quantity,
                                        ];
                                    }),
                                ];
                            }),

                            // Öncədən ödənişlər
                            'prepayments' => $order->prepayments->map(function ($prepayment) {
                                return [
                                    'id' => $prepayment->id,
                                    'amount' => $prepayment->amount,
                                    'created_at' => $prepayment->created_at,
                                ];
                            }),
                        ],
                    ];
                }),
            ];
        });

        return response()->json([
            'tables' => $formattedTables,
        ]);
    }



    // public function approvePendingOrder(Request $request, $table_order_id)
    // {
    //     $tableOrder = TableOrder::where('restaurant_id', $request->user()->restaurant_id)->findOrFail($table_order_id);

    //     if (!$tableOrder) {
    //         return response()->json(['error' => 'Table order not found.'], 404);
    //     }

    //     $order = $tableOrder->order;



    //     if ($order->status != 'pending_approval') {
    //         return response()->json(['error' => 'Order is not pending approval.'], 400);
    //     }

    //     $approvedTableOrder = TableOrder::where('restaurant_id', $request->user()->restaurant_id)
    //         ->where('table_id', $tableOrder->table_id)
    //         ->whereHas('order', function ($query) {
    //             $query->where('status', 'approved');
    //         })
    //         ->first();

    //     if ($approvedTableOrder) {
    //         // Approved order exists, add stocks to it
    //         // Your code to add stocks here
    //         // Add stocks to the approved order
    //         foreach ($tableOrder->order->stocks as $stock) {
    //             $existingStock = $approvedTableOrder->order->stocks()->where('stock_id', $stock->id)->first();

    //             if ($existingStock) {
    //                 // If the stock exists, increase the quantity
    //                 $approvedTableOrder->order->stocks()->updateExistingPivot($stock->id, [
    //                     'quantity' => $existingStock->pivot->quantity + $stock->pivot->quantity,
    //                 ]);
    //             } else {
    //                 // Otherwise, attach the stock to the approved order
    //                 $approvedTableOrder->order->stocks()->attach($stock->id, [
    //                     'quantity' => $stock->pivot->quantity,
    //                 ]);
    //             }
    //         }

    //         // Delete the pending order
    //         $tableOrder->order->delete();
    //     } else {
    //         // No approved order exists, change status
    //         $order->update(['status' => 'approved', 'user_id' => $request->user()->id]);
    //     }

    //     return response()->json($order->load('stocks'));
    // }

    public function approvePendingOrder(Request $request, $table_order_id)
    {
        $tableOrder = TableOrder::where('restaurant_id', $request->user()->restaurant_id)
            ->find($table_order_id);

        if (!$tableOrder) {
            return response()->json(['error' => 'Table order not found.'], 404);
        }

        $order = $tableOrder->order;

        if ($order->status !== 'pending_approval') {
            return response()->json(['error' => 'Order is not pending approval.'], 400);
        }

        $approvedTableOrder = TableOrder::where('restaurant_id', $request->user()->restaurant_id)
            ->where('table_id', $tableOrder->table_id)
            ->whereHas('order', fn($q) => $q->where('status', 'approved'))
            ->first();

        if ($approvedTableOrder) {
            // 🔁 Merge stocks
            foreach ($tableOrder->order->stocks as $stock) {
                $existingStock = $approvedTableOrder->order->stocks()
                    ->wherePivot('detail_id', $stock->pivot->detail_id)
                    ->where('stock_id', $stock->id)
                    ->first();

                if ($existingStock) {
                    $approvedTableOrder->order->stocks()->updateExistingPivot($stock->id, [
                        'quantity' => $existingStock->pivot->quantity + $stock->pivot->quantity,
                        'detail_id' => $stock->pivot->detail_id,
                    ]);
                } else {
                    $approvedTableOrder->order->stocks()->attach($stock->id, [
                        'quantity' => $stock->pivot->quantity,
                        'detail_id' => $stock->pivot->detail_id,
                    ]);
                }
            }

            // 🔁 Merge stock sets
            foreach ($tableOrder->order->stockSets as $set) {
                $existingSet = $approvedTableOrder->order->stockSets()
                    ->where('stock_set_id', $set->id)
                    ->first();

                if ($existingSet) {
                    $approvedTableOrder->order->stockSets()->updateExistingPivot($set->id, [
                        'quantity' => $existingSet->pivot->quantity + $set->pivot->quantity,
                        'price' => $set->pivot->price,
                    ]);
                } else {
                    $approvedTableOrder->order->stockSets()->attach($set->id, [
                        'quantity' => $set->pivot->quantity,
                        'price' => $set->pivot->price,
                    ]);
                }
            }

            $tableOrder->order->delete();

            return response()->json($approvedTableOrder->order->load([
                'stocks',
                'stockSets.stockSetItems.stock' // lazım olsa setin içindəki məhsulları da yükləyir
            ]));
        }

        // ✅ Əgər təsdiqlənmiş order yoxdursa
        $order->update([
            'status' => 'approved',
            'user_id' => $request->user()->id
        ]);

        return response()->json($order->load([
            'stocks',
            'stockSets.stockSetItems.stock'
        ]));
    }

    public function cancelPendingOrder(Request $request, $table_order_id)
    {
        $tableOrder = TableOrder::where('restaurant_id', $request->user()->restaurant_id)->findOrFail($table_order_id);

        if (!$tableOrder) {
            return response()->json(['error' => 'Table order not found.'], 404);
        }

        $order = $tableOrder->order;

        if ($order->status != 'pending_approval') {
            return response()->json(['error' => 'Order is not pending approval.'], 400);
        }

        $order->delete();

        return response()->json(['message' => 'Order canceled successfully']);
    }

    private function adjustRawMaterials(Stock $stock, int $quantity, bool $reverse = false): void
    {
        foreach ($stock->rawMaterials as $material) {
            $pivotQuantity = $material->pivot->quantity;
            $total = $pivotQuantity * $quantity;

            if ($reverse) {
                $material->stock->increment('quantity', $total);
            } else {
                if ($material->stock->quantity < $total) {
                    throw new \Exception("Xammal kifayət etmir: {$material->name}");
                }
                $material->stock->decrement('quantity', $total);
            }
        }
    }

}
