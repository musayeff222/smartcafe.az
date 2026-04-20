<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerTransaction;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class PaymentService
{
    private function getTimeRange(array $filters, string $openTime, string $closeTime): array
    {
        $now = now();
        $today = $now->toDateString();
        $yesterday = $now->subDay()->toDateString();

        $openTimeParsed = Carbon::parse($openTime);
        $closeTimeParsed = Carbon::parse($closeTime);

        // Normaldə, gün dəyişməyən (09:00 - 18:00) saatlar üçün
        if ($openTimeParsed->lte($closeTimeParsed)) {
            $startDateTime = Carbon::parse("$today $openTime");
            $endDateTime = Carbon::parse("$today $closeTime");
        } else {
            // Gün dəyişən saatlar üçün (məsələn 09:00 - 03:00)
            if ($now->format('H:i') >= $openTime || $now->format('H:i') < $closeTime) {
                // İndiki vaxt range daxilindədirsə
                if ($now->format('H:i') >= $openTime) {
                    $startDateTime = Carbon::parse("$today $openTime");
                    $endDateTime = Carbon::parse("$today $closeTime")->addDay();
                } else {
                    $startDateTime = Carbon::parse("$yesterday $openTime");
                    $endDateTime = Carbon::parse("$today $closeTime");
                }
            } else {
                // Çölündədirsə — sabahkı açılışı gözləyir
                $startDateTime = Carbon::parse("$today $openTime");
                $endDateTime = Carbon::parse("$today $closeTime")->addDay();
            }
        }

        return [
            $filters['open_date'] ? Carbon::parse($filters['open_date'])->toDateTimeString() : $startDateTime->toDateTimeString(),
            $filters['close_date'] ? Carbon::parse($filters['close_date'])->toDateTimeString() : $endDateTime->toDateTimeString(),
        ];
    }

    private function getTotalByType(string $restaurantId, string $type, string $startDateTime, string $endDateTime): float
    {
        return (float) Payment::where('payments.restaurant_id', $restaurantId)
            ->where(function ($q) use ($startDateTime, $endDateTime) {
                $q->whereBetween('payments.open_date', [$startDateTime, $endDateTime])
                    ->orWhereBetween('payments.close_date', [$startDateTime, $endDateTime]);
            })
            ->where('payments.type', $type)
            ->sum('payments.amount');
    }

//    public function getDailyPayments(array $filters): array
//    {
//        [$startDateTime, $endDateTime] = $this->getTimeRange($filters, $filters['open_time'], $filters['close_time']);
//        $restaurantId = $filters['restaurant_id'];
//
//        $query = Payment::query()
//            ->where('payments.restaurant_id', $restaurantId)
//            ->where(function ($q) use ($startDateTime, $endDateTime) {
//                $q->whereBetween('payments.open_date', [$startDateTime, $endDateTime])
//                    ->orWhereBetween('payments.close_date', [$startDateTime, $endDateTime]);
//            })
//            ->leftJoin('users', 'payments.user_id', '=', 'users.id')
//            ->leftJoin('customers', 'payments.customer_id', '=', 'customers.id')
//            ->select(
//                'payments.order_id',
//                'payments.order_name',
//                'payments.items',
//                'payments.open_date',
//                'payments.close_date',
//                'users.name as user_name',
//                'customers.name as customer_name',
//                DB::raw('SUM(payments.amount) as total_amount'),
//                DB::raw("CASE WHEN COUNT(DISTINCT payments.type) > 1 THEN 'mixed' ELSE MAX(payments.type) END as type")
//            );
//
//        if (!empty($filters['user_id'])) {
//            $query->where('payments.user_id', $filters['user_id']);
//        }
//
//        if (!empty($filters['type'])) {
//            if ($filters['type'] === 'mixed') {
//                $query->havingRaw('COUNT(DISTINCT payments.type) > 1');
//            } else {
//                $query->where('payments.type', $filters['type']);
//            }
//        }
//
//        $payments = $query->groupBy(
//            'payments.order_id',
//            'payments.order_name',
//            'payments.items',
//            'payments.open_date',
//            'payments.close_date',
//            'users.name',
//            'customers.name'
//        )->get();
//
//        $orderIds = $payments->pluck('order_id')->unique()->values();
//
//
//        $timeCharges = DB::table('time_charges')
//            ->whereIn('order_id', $orderIds)
//            ->select([
//                'order_id',
//                DB::raw("JSON_ARRAYAGG(JSON_OBJECT('title', title, 'amount', amount)) AS tc_list"),
//                DB::raw("SUM(amount) AS tc_total"),
//            ])
//            ->groupBy('order_id')
//            ->get()
//            ->keyBy('order_id'); // xəritə: order_id => {tc_list, tc_total}
//
//
//        // 🔄 Order-a əsaslanıb məhsul və setləri doldur
//        $payments->transform(function ($payment) {
//            $items = [];
//
//            $order = Order::with([
//                'stocks',
//                'stockSets.stockSetItems.stock' // nested komponentləri də daxil et
//            ])->find($payment->order_id);
//
//            if ($order) {
//                // ✅ Adi məhsullar
//                foreach ($order->stocks as $stock) {
//                    $items[] = [
//                        'name' => $stock->name,
//                        'price' => $stock->price,
//                        'quantity' => $stock->pivot->quantity,
//                    ];
//                }
//
//                foreach ($order->stockSets as $set) {
//                    $components = $set->stockSetItems->map(function ($item) {
//                        return [
//                            'name' => $item->stock->name ?? 'unknown',
//                            'quantity' => $item->quantity,
//                        ];
//                    });
//
//                    $unitPrice = (float) $set->pivot->price;
//                    $quantity = (int) $set->pivot->quantity;
//
//                    $items[] = [
//                        'name' => 'Set: ' . $set->name,
//                        'unit_price' => $unitPrice,            // 1 setin qiyməti
//                        'quantity' => $quantity,
//                        'price' => $unitPrice * $quantity,     // ✔️ ümumi qiymət
//                        'components' => $components,
//                    ];
//                }
//
//            }
//
//            $payment->items = $items;
//            return $payment;
//        });
//
//        // 🔢 Ümumi statistikalar
//        $commonConditions = function ($query) use ($startDateTime, $endDateTime) {
//            $query->where(function ($q) use ($startDateTime, $endDateTime) {
//                $q->whereBetween('payments.open_date', [$startDateTime, $endDateTime])
//                    ->orWhereBetween('payments.close_date', [$startDateTime, $endDateTime]);
//            });
//        };
//
//        $totalAmount = (float) Payment::where('payments.restaurant_id', $restaurantId)
//            ->where($commonConditions)
//            ->sum('payments.amount');
//
//        $totalQuantity = Payment::where('payments.restaurant_id', $restaurantId)
//            ->where($commonConditions)
//            ->count();
//
//        $totalCash = $this->getTotalByType($restaurantId, 'cash', $startDateTime, $endDateTime);
//        $totalBank = $this->getTotalByType($restaurantId, 'bank', $startDateTime, $endDateTime);
//
//        return [
//            'payments' => $payments,
//            'total_amount' => $totalAmount,
//            'total_quantity' => $totalQuantity,
//            'total_cash' => $totalCash,
//            'total_bank' => $totalBank,
//        ];
//    }


    public function getDailyPayments(array $filters): array
    {
        [$startDateTime, $endDateTime] = $this->getTimeRange($filters, $filters['open_time'], $filters['close_time']);
        $restaurantId = $filters['restaurant_id'];

        $query = Payment::query()
            ->where('payments.restaurant_id', $restaurantId)
            ->where(function ($q) use ($startDateTime, $endDateTime) {
                $q->whereBetween('payments.open_date', [$startDateTime, $endDateTime])
                    ->orWhereBetween('payments.close_date', [$startDateTime, $endDateTime]);
            })
            ->leftJoin('users', 'payments.user_id', '=', 'users.id')
            ->leftJoin('customers', 'payments.customer_id', '=', 'customers.id')
            ->select(
                'payments.order_id',
                'payments.order_name',
                'payments.items',
                'payments.open_date',
                'payments.close_date',
                'users.name as user_name',
                'customers.name as customer_name',
                DB::raw('SUM(payments.amount) as total_amount'),
                DB::raw("CASE WHEN COUNT(DISTINCT payments.type) > 1 THEN 'mixed' ELSE MAX(payments.type) END as type")
            );

        if (!empty($filters['user_id'])) {
            $query->where('payments.user_id', $filters['user_id']);
        }

        if (!empty($filters['type'])) {
            if ($filters['type'] === 'mixed') {
                $query->havingRaw('COUNT(DISTINCT payments.type) > 1');
            } else {
                $query->where('payments.type', $filters['type']);
            }
        }

        $payments = $query->groupBy(
            'payments.order_id',
            'payments.order_name',
            'payments.items',
            'payments.open_date',
            'payments.close_date',
            'users.name',
            'customers.name'
        )->get();

        $orderIds = $payments->pluck('order_id')->unique()->values();

        // time_charges məlumatını əvvəlcədən çəkib order_id üzrə xəritələyirik
        $timeChargesMap = DB::table('time_charges')
            ->whereIn('order_id', $orderIds)
            ->select([
                'order_id',
                DB::raw("JSON_ARRAYAGG(JSON_OBJECT('title', title, 'amount', amount)) AS tc_list"),
                DB::raw("SUM(amount) AS tc_total"),
            ])
            ->groupBy('order_id')
            ->get()
            ->keyBy('order_id');

        // 🔄 Order-a əsaslanıb məhsul, setlər və varsa time_charges-ları doldur
        $payments->transform(function ($payment) use ($timeChargesMap) {
            $items = [];

            $order = Order::with([
                'stocks',
                'stockSets.stockSetItems.stock'
            ])->find($payment->order_id);

            if ($order) {
                // ✅ Adi məhsullar

                foreach ($order->stocks as $stock) {
                    $items[] = [
                        'name'     => $stock->name,
                        'price'    => (float) $stock->price,
                        'quantity' => (int) $stock->pivot->quantity,
                    ];
                }

                // ✅ Setlər
                foreach ($order->stockSets as $set) {
                    $components = $set->stockSetItems->map(function ($item) {
                        return [
                            'name'     => $item->stock->name ?? 'unknown',
                            'quantity' => (int) $item->quantity,
                        ];
                    });

                    $unitPrice = (float) $set->pivot->price;
                    $quantity  = (int) $set->pivot->quantity;

                    $items[] = [
                        'name'        => 'Set: ' . $set->name,
                        'unit_price'  => $unitPrice,
                        'quantity'    => $quantity,
                        'price'       => $unitPrice * $quantity,
                        'components'  => $components,
                    ];
                }
            }

            // ⏱️ Time charges varsa, komponentlər kimi əlavə et
            if (isset($timeChargesMap[$payment->order_id])) {
                $tcRow  = $timeChargesMap[$payment->order_id];
                $tcList = json_decode($tcRow->tc_list ?? '[]', true) ?: [];

                $grouped = [];
                foreach ($tcList as $tc) {
                    $name   = trim($tc['title'] ?? 'Play Station');
                    $price  = isset($tc['amount']) ? (float) $tc['amount'] : 0.0;
                    $key    = md5($name.'|'.$price);

                    if (!isset($grouped[$key])) {
                        $grouped[$key] = ['name' => $name, 'price' => $price, 'quantity' => 1];
                    } else {
                        $grouped[$key]['quantity']++;
                    }
                }

                foreach ($grouped as $row) {
                    $items[] = $row;
                }
            }


            $payment->items = $items;
            return $payment;
        });

        // 🔢 Ümumi statistikalar
        $commonConditions = function ($query) use ($startDateTime, $endDateTime) {
            $query->where(function ($q) use ($startDateTime, $endDateTime) {
                $q->whereBetween('payments.open_date', [$startDateTime, $endDateTime])
                    ->orWhereBetween('payments.close_date', [$startDateTime, $endDateTime]);
            });
        };

        $totalAmount = (float) Payment::where('payments.restaurant_id', $restaurantId)
            ->where($commonConditions)
            ->sum('payments.amount');

        $totalQuantity = Payment::where('payments.restaurant_id', $restaurantId)
            ->where($commonConditions)
            ->count();

        $totalCash = $this->getTotalByType($restaurantId, 'cash', $startDateTime, $endDateTime);
        $totalBank = $this->getTotalByType($restaurantId, 'bank', $startDateTime, $endDateTime);

        return [
            'payments'      => $payments,
            'total_amount'  => $totalAmount,
            'total_quantity'=> $totalQuantity,
            'total_cash'    => $totalCash,
            'total_bank'    => $totalBank,
        ];
    }




    public function processPayment(Request $request, $orderId): array
    {
        DB::beginTransaction();

        try {
            $restaurantId = $request->user()->restaurant_id;
            $order = Order::where('restaurant_id', $restaurantId)->findOrFail($orderId);

            if (($order->tableOrders && $request->user()->cannot('manage-tables')) ||
                ($order->quickOrder && $request->user()->cannot('manage-quick-orders'))) {
                return ['message' => 'Forbidden', 'status' => 403];
            }

            if ($order->status !== 'approved') {
                return ['message' => 'Order is not approved.', 'status' => 400];
            }

//            if ($order->totalAmount() <= $order->totalPayments()) {
//                return ['message' => 'Order is already fully paid.', 'status' => 400];
//            }

            $shares = $request->validated()['shares'];
            $totalPrepayments = $order->totalPrepayments();

            if (count($shares) > 1 && collect($shares)->where('type', 'customer_balance')->isNotEmpty()) {
                return ['message' => 'Only one customer_balance payment is allowed.', 'status' => 400];
            }

            $shares[0]['amount'] += $totalPrepayments;
            $createdPayments = [];

            foreach ($shares as $share) {
                if ($share['type'] === 'customer_balance') {
                    $customer = Customer::where('restaurant_id', $restaurantId)->findOrFail($share['customer_id']);
                    $customer->decrement('money', $share['amount']);

                    CustomerTransaction::create([
                        'customer_id' => $share['customer_id'],
                        'amount' => $share['amount'],
                        'type' => 'debit',
                        'note' => "Sifariş ödənildi #{$order->id}",
                        'date' => now(),
                        'restaurant_id' => $restaurantId,
                    ]);
                }

                $payment = Payment::create([
                    'order_id' => $order->id,
                    'restaurant_id' => $restaurantId,
                    'amount' => $share['amount'],
                    'type' => $share['type'],
                    'date' => now(),
                    'customer_id' => $share['customer_id'] ?? null,
                    'user_id' => $request->user()->id,
                    'open_date' => $order->created_at,
                    'close_date' => now(),
                    'order_name' => $order->tableOrders?->table->name ?? $order->quickOrder?->name,
                    'items' => !empty(array_filter($share['items'] ?? [])) ? $share['items'] : null,
                ]);

                $createdPayments[] = $payment;
            }

            $order->update(['status' => 'completed']);

            DB::commit();
            return ['message' => 'Payments processed successfully.', 'status' => 201, 'payments' => $createdPayments];
        } catch (\Throwable $e) {
            DB::rollBack();
            logger()->error('Payment Processing Failed', ['error' => $e->getMessage()]);
            return ['message' => 'An unexpected error occurred.', 'status' => 500];
        }
    }
}