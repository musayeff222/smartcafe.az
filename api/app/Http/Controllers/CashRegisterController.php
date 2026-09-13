<?php

namespace App\Http\Controllers;

use App\Models\CashRegisterSession;
use App\Models\Payment;
use Illuminate\Http\Request;

class CashRegisterController extends Controller
{
    public function status(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;

        $session = CashRegisterSession::where('restaurant_id', $restaurantId)
            ->whereNull('closed_at')
            ->with('user:id,name')
            ->latest('opened_at')
            ->first();

        if (!$session) {
            return response()->json(['open' => false, 'session' => null]);
        }

        $summary = $this->sessionSummary($restaurantId, $session->opened_at);

        return response()->json([
            'open' => true,
            'session' => [
                'id' => $session->id,
                'opened_at' => $session->opened_at->toIso8601String(),
                'opening_cash' => (float) $session->opening_cash,
                'user_name' => $session->user?->name,
                'summary' => $summary,
            ],
        ]);
    }

    public function open(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;

        $existing = CashRegisterSession::where('restaurant_id', $restaurantId)
            ->whereNull('closed_at')
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'Kassa artıq açıqdır.'], 409);
        }

        $validated = $request->validate([
            'opening_cash' => 'nullable|numeric|min:0',
            'note' => 'nullable|string|max:500',
        ]);

        $session = CashRegisterSession::create([
            'restaurant_id' => $restaurantId,
            'user_id' => $request->user()->id,
            'opened_at' => now(),
            'opening_cash' => $validated['opening_cash'] ?? 0,
            'note' => $validated['note'] ?? null,
        ]);

        $session->load('user:id,name');

        return response()->json([
            'message' => 'Kassa açıldı.',
            'session' => [
                'id' => $session->id,
                'opened_at' => $session->opened_at->toIso8601String(),
                'opening_cash' => (float) $session->opening_cash,
                'user_name' => $session->user?->name,
                'summary' => $this->sessionSummary($restaurantId, $session->opened_at),
            ],
        ], 201);
    }

    public function close(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;

        $session = CashRegisterSession::where('restaurant_id', $restaurantId)
            ->whereNull('closed_at')
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Açıq kassa tapılmadı.'], 404);
        }

        $validated = $request->validate([
            'closing_cash' => 'nullable|numeric|min:0',
            'note' => 'nullable|string|max:500',
        ]);

        $summary = $this->sessionSummary($restaurantId, $session->opened_at);

        $session->update([
            'closed_at' => now(),
            'closing_cash' => $validated['closing_cash'] ?? null,
            'note' => $validated['note'] ?? $session->note,
        ]);

        return response()->json([
            'message' => 'Kassa bağlandı.',
            'session' => [
                'id' => $session->id,
                'opened_at' => $session->opened_at->toIso8601String(),
                'closed_at' => $session->closed_at->toIso8601String(),
                'opening_cash' => (float) $session->opening_cash,
                'closing_cash' => $session->closing_cash !== null ? (float) $session->closing_cash : null,
                'summary' => $summary,
            ],
        ]);
    }

    private function sessionSummary(int $restaurantId, $openedAt): array
    {
        $openedStr = $openedAt instanceof \Carbon\Carbon
            ? $openedAt->format('Y-m-d H:i:s')
            : (string) $openedAt;

        $base = Payment::where('restaurant_id', $restaurantId)
            ->where(function ($q) use ($openedStr) {
                $q->where('open_date', '>=', $openedStr)
                    ->orWhere('close_date', '>=', $openedStr)
                    ->orWhere('created_at', '>=', $openedStr);
            });

        return [
            'total' => (float) (clone $base)->sum('amount'),
            'cash' => (float) (clone $base)->where('type', 'cash')->sum('amount'),
            'bank' => (float) (clone $base)->where('type', 'bank')->sum('amount'),
            'count' => (int) (clone $base)->distinct('order_id')->count('order_id'),
        ];
    }
}
