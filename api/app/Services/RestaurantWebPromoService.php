<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\RestaurantWebPromoCode;
use App\Models\Stock;
use App\Models\StockDetail;
use Carbon\Carbon;

class RestaurantWebPromoService
{
    public const PROMO_TIMEZONE = 'Asia/Baku';

    public function findValidPromo(int $restaurantId, string $code): ?RestaurantWebPromoCode
    {
        return $this->getPromoFailureReason($restaurantId, $code) === null
            ? $this->findPromoByCode($restaurantId, $code)
            : null;
    }

    public function findPromoByCode(int $restaurantId, string $code): ?RestaurantWebPromoCode
    {
        $code = strtoupper(trim($code));
        if ($code === '') {
            return null;
        }

        return RestaurantWebPromoCode::where('restaurant_id', $restaurantId)
            ->where('code', $code)
            ->first();
    }

    public function getPromoFailureReason(int $restaurantId, string $code): ?string
    {
        $promo = $this->findPromoByCode($restaurantId, $code);

        if (!$promo) {
            return 'not_found';
        }

        if (!$this->isPromoEnabled($promo)) {
            return 'inactive';
        }

        $now = Carbon::now(self::PROMO_TIMEZONE);

        if ($promo->valid_from) {
            $from = $promo->valid_from->copy()->timezone(self::PROMO_TIMEZONE);
            if ($now->lt($from)) {
                return 'not_started';
            }
        }

        if ($promo->valid_until) {
            $until = $promo->valid_until->copy()->timezone(self::PROMO_TIMEZONE);
            if ($now->gt($until)) {
                return 'expired';
            }
        }

        if ($promo->max_uses !== null && $promo->uses_count >= $promo->max_uses) {
            return 'max_uses';
        }

        return null;
    }

    public function failureMessage(?string $reason): string
    {
        return match ($reason) {
            'not_found' => 'Promo kod tapılmadı.',
            'inactive' => 'Promo kod deaktivdir.',
            'not_started' => 'Promo kod hələ aktiv deyil.',
            'expired' => 'Promo kodun müddəti bitib.',
            'max_uses' => 'Promo kodun istifadə limiti dolub.',
            default => 'Promo kod etibarsızdır.',
        };
    }

    public function parseInputDate(?string $value): ?Carbon
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        return Carbon::parse($value, self::PROMO_TIMEZONE)->utc();
    }

    public function isPromoEnabled(RestaurantWebPromoCode $promo): bool
    {
        return (bool) $promo->is_active;
    }

    private function isTruthy(mixed $value): bool
    {
        return $value === true || $value === 1 || $value === '1';
    }

    public function calculateSubtotal(Restaurant $restaurant, array $stocks): float
    {
        $total = 0.0;

        foreach ($stocks as $stockData) {
            $stock = Stock::where('restaurant_id', $restaurant->id)
                ->where('show_on_qr', true)
                ->find($stockData['stock_id'] ?? null);

            if (!$stock) {
                continue;
            }

            $quantity = (int) ($stockData['quantity'] ?? 0);
            if ($quantity < 1) {
                continue;
            }

            $price = (float) $stock->price;
            $detailId = $stockData['detail_id'] ?? null;

            if ($detailId) {
                $detail = StockDetail::where('id', $detailId)
                    ->where('stock_id', $stock->id)
                    ->first();
                if ($detail) {
                    $price = (float) $detail->price;
                }
            }

            $total += $price * $quantity;
        }

        return round($total, 2);
    }

    public function calculateDiscount(float $subtotal, RestaurantWebPromoCode $promo): float
    {
        if ($subtotal <= 0) {
            return 0.0;
        }

        if ($promo->discount_type === 'fixed') {
            return round(min((float) $promo->discount_value, $subtotal), 2);
        }

        return round($subtotal * ((float) $promo->discount_value / 100), 2);
    }

    public function buildQuote(Restaurant $restaurant, array $stocks, ?string $promoCode): array
    {
        $subtotal = $this->calculateSubtotal($restaurant, $stocks);

        if (!$promoCode) {
            return [
                'valid' => false,
                'subtotal' => $subtotal,
                'discount' => 0,
                'total' => $subtotal,
                'message' => 'Promo kod daxil edin.',
            ];
        }

        $reason = $this->getPromoFailureReason($restaurant->id, $promoCode);
        if ($reason) {
            return [
                'valid' => false,
                'subtotal' => $subtotal,
                'discount' => 0,
                'total' => $subtotal,
                'reason' => $reason,
                'message' => $this->failureMessage($reason),
            ];
        }

        $promo = $this->findPromoByCode($restaurant->id, $promoCode);
        $discount = $this->calculateDiscount($subtotal, $promo);
        $total = round(max(0, $subtotal - $discount), 2);

        return [
            'valid' => true,
            'code' => $promo->code,
            'title' => $promo->title,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $total,
            'discount_type' => $promo->discount_type,
            'discount_value' => (float) $promo->discount_value,
        ];
    }
}
