<?php

namespace App\Http\Controllers;

use App\Models\RestaurantWebPromoCode;
use App\Services\RestaurantWebPromoService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RestaurantWebPromoCodeController extends Controller
{
    public function __construct(private RestaurantWebPromoService $promoService)
    {
    }

    public function index(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $promos = RestaurantWebPromoCode::where('restaurant_id', $restaurant->id)
            ->orderByDesc('is_active')
            ->orderByDesc('id')
            ->get()
            ->map(function (RestaurantWebPromoCode $promo) use ($restaurant) {
                $reason = $this->promoService->getPromoFailureReason($restaurant->id, $promo->code);

                return array_merge($promo->toArray(), [
                    'is_active' => $this->promoService->isPromoEnabled($promo),
                    'is_usable' => $reason === null,
                    'status_reason' => $reason,
                ]);
            });

        return response()->json($promos);
    }

    public function store(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $this->normalizePromoInput($request);
        $data = $this->validated($request, $restaurant->id);
        $data['restaurant_id'] = $restaurant->id;
        $data['code'] = strtoupper(trim($data['code']));
        $data['is_active'] = $request->boolean('is_active', true);
        $data['valid_from'] = $this->promoService->parseInputDate($request->input('valid_from'));
        $data['valid_until'] = $this->promoService->parseInputDate($request->input('valid_until'));

        $promo = RestaurantWebPromoCode::create($data);

        return response()->json($promo, 201);
    }

    public function update(Request $request, $id)
    {
        $restaurant = $request->user()->restaurant;
        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $promo = RestaurantWebPromoCode::where('restaurant_id', $restaurant->id)->findOrFail($id);
        $this->normalizePromoInput($request);
        $data = $this->validated($request, $restaurant->id, $promo);

        if (isset($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        $data['is_active'] = $request->boolean('is_active', true);
        $data['valid_from'] = $this->promoService->parseInputDate($request->input('valid_from'));
        $data['valid_until'] = $this->promoService->parseInputDate($request->input('valid_until'));

        $promo->update($data);

        return response()->json($promo->fresh());
    }

    public function destroy(Request $request, $id)
    {
        $restaurant = $request->user()->restaurant;
        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        $promo = RestaurantWebPromoCode::where('restaurant_id', $restaurant->id)->findOrFail($id);
        $promo->delete();

        return response()->json(null, 204);
    }

    protected function normalizePromoInput(Request $request): void
    {
        $request->merge([
            'valid_from' => $request->input('valid_from') ?: null,
            'valid_until' => $request->input('valid_until') ?: null,
            'max_uses' => $request->input('max_uses') ?: null,
        ]);
    }

    protected function validated(Request $request, int $restaurantId, ?RestaurantWebPromoCode $promo = null): array
    {
        $codeRule = ['required', 'string', 'max:64'];
        if ($promo) {
            $codeRule = ['sometimes', 'string', 'max:64', Rule::unique('restaurant_web_promo_codes', 'code')->where('restaurant_id', $restaurantId)->ignore($promo->id)];
        } else {
            $codeRule[] = Rule::unique('restaurant_web_promo_codes', 'code')->where('restaurant_id', $restaurantId);
        }

        return $request->validate([
            'code' => $codeRule,
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:2000',
            'discount_type' => 'sometimes|in:percent,fixed',
            'discount_value' => 'sometimes|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'sometimes|boolean',
        ]);
    }
}
