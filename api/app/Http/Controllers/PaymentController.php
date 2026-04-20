<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Models\Customer;
use App\Models\CustomerTransaction;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\PaymentService;

class PaymentController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    public function index(Request $request)
    {
//        return$request;
        $restaurant = $request->user()->restaurant;
        $filters = [
            'restaurant_id' => $restaurant->id,
            'open_time' => $restaurant->open_time ?? '06:00',
            'close_time' => $restaurant->close_time ?? '18:00',
            'open_date' => $request->input('open_date'),
            'close_date' => $request->input('close_date'),
            'user_id' => $request->input('user_id'),
            'type' => $request->input('type'),
        ];

        return response()->json($this->paymentService->getDailyPayments($filters));
    }

    public function store(StorePaymentRequest $request, $orderId)
    {
        try {
            $result = $this->paymentService->processPayment($request, $orderId);
            return response()->json(['message' => $result['message']], $result['status']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to store payments.'], 500);
        }
    }

    public function destroyByOrderId(Request $request, $orderId)
    {
        try {
            $order = Order::where('restaurant_id', $request->user()->restaurant_id)->find($orderId);

            if (!$order) {
                return response()->json(['message' => 'Order not found.'], 404);
            }

            $order->payments()->delete();
            return response()->json(['message' => 'Payments deleted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete payments.'], 500);
        }
    }
}
