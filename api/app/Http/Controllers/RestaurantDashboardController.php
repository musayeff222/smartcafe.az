<?php

namespace App\Http\Controllers;

use App\Services\RestaurantDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RestaurantDashboardController extends Controller
{
    public function __construct(
        private readonly RestaurantDashboardService $dashboard
    ) {
    }

    /**
     * Unified restaurant dashboard (cached ~45s).
     * Real-time: poll this endpoint or wire Laravel Echo + broadcasting later.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user?->restaurant;

        if (!$restaurant) {
            return response()->json(['message' => 'No restaurant'], 403);
        }

        $validated = $request->validate([
            'filter' => 'nullable|in:today,yesterday,week,month,custom',
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
            'branch_id' => 'nullable|string',
        ]);

        $data = $this->dashboard->getDashboard($restaurant, [
            'filter' => $validated['filter'] ?? 'today',
            'from' => $validated['from'] ?? null,
            'to' => $validated['to'] ?? null,
            'branch_id' => $validated['branch_id'] ?? null,
        ]);

        return response()->json($data);
    }
}
