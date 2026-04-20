<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderPrepaymentRequest;
use App\Models\Order;
use App\Models\OrderPrepayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    //

    public function getPrepayments(Request $request, $orderId)
    {
        $order = Order::where('restaurant_id', $request->user()->restaurant_id)->find($orderId);

        if (!$order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        return response()->json($order->prepayments);
    }

    public function storePrepayments(StoreOrderPrepaymentRequest $request, $orderId)
    {
        DB::beginTransaction();

        try {

            $order = Order::where('restaurant_id', $request->user()->restaurant_id)->find($orderId);

            if (!$order) {
                return response()->json(['message' => 'Order not found.'], 404);
            }

            if ($order->status !== 'approved') {
                return response()->json(['message' => 'Order is not approved.'], 400);
            }

            if ($order->totalAmount() <= $order->totalPrepayments()) {
                return response()->json(['message' => 'Order is already fully paid.'], 400);
            }

            if ($request->amount > $order->totalAmount() - $order->totalPrepayments()) {
                return response()->json(['message' => 'Amount exceeds the remaining balance.'], 400);
            }

            $prepayment = OrderPrepayment::create([
                'order_id' => $order->id,
                'amount' => $request->amount,
                'type' => $request->type,  // Handle type field
                'date' => $request->date,
            ]);

            // Handle customer balance if type is 'customer_balance'
            // if ($request->type === 'customer_balance') {
            //     $customer = $order->customer;  // Assuming the Order model has a customer relationship
            //     if ($customer) {
            //         $customer->money -= $request->amount;
            //         $customer->save();
            //     }
            // }

            DB::commit();

            return response()->json($prepayment, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error processing prepayment.'], 500);
        }
    }

    public function destroyPrepayment(Request $request, $orderId, $prepaymentId)
    {
        DB::beginTransaction();

        try {

            $order = Order::where('restaurant_id', $request->user()->restaurant_id)->find($orderId);

            if (!$order) {
                return response()->json(['message' => 'Order not found.'], 404);
            }

            $prepayment = $order->prepayments()->find($prepaymentId);

            if (!$prepayment) {
                return response()->json(['message' => 'Prepayment not found.'], 404);
            }

            // Handle customer balance if type is 'customer_balance'
            // if ($prepayment->type === 'customer_balance') {
            //     $customer = $order->customer;  // Assuming the Order model has a customer relationship
            //     if ($customer) {
            //         $customer->money += $prepayment->amount;
            //         $customer->save();
            //     }
            // }

            $prepayment->delete();

            DB::commit();

            return response()->json(['message' => 'Prepayment deleted.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error deleting prepayment.'], 500);
        }
    }

}
