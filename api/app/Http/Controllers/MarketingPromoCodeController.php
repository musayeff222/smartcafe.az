<?php

namespace App\Http\Controllers;

use App\Models\MarketingPromoCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class MarketingPromoCodeController extends Controller
{
    public function index()
    {
        return MarketingPromoCode::query()
            ->with('plan:id,name,slug')
            ->orderByDesc('id')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $data['code'] = strtoupper($data['code']);
        $promo = MarketingPromoCode::query()->create($data);
        Cache::forget('marketing_page_v1');

        return response()->json($promo->load('plan:id,name,slug'), 201);
    }

    public function show(MarketingPromoCode $promo)
    {
        return $promo->load('plan:id,name,slug');
    }

    public function update(Request $request, MarketingPromoCode $promo)
    {
        $data = $this->validatedForUpdate($request, $promo);
        if (isset($data['code'])) {
            $data['code'] = strtoupper($data['code']);
        }
        $promo->update($data);
        Cache::forget('marketing_page_v1');

        return response()->json($promo->load('plan:id,name,slug'));
    }

    public function destroy(MarketingPromoCode $promo)
    {
        $promo->delete();
        Cache::forget('marketing_page_v1');

        return response()->noContent();
    }

    protected function validated(Request $request): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:64', Rule::unique('marketing_promo_codes', 'code')],
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:2000',
            'discount_type' => ['required', Rule::in(['percent', 'fixed'])],
            'discount_value' => 'required|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'uses_count' => 'sometimes|integer|min:0',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'marketing_plan_id' => 'nullable|exists:marketing_plans,id',
            'show_on_landing' => 'boolean',
            'is_active' => 'boolean',
        ]);
    }

    protected function validatedForUpdate(Request $request, MarketingPromoCode $promo): array
    {
        return $request->validate([
            'code' => ['sometimes', 'string', 'max:64', Rule::unique('marketing_promo_codes', 'code')->ignore($promo->id)],
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:2000',
            'discount_type' => ['sometimes', Rule::in(['percent', 'fixed'])],
            'discount_value' => 'sometimes|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'uses_count' => 'sometimes|integer|min:0',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'marketing_plan_id' => 'nullable|exists:marketing_plans,id',
            'show_on_landing' => 'boolean',
            'is_active' => 'boolean',
        ]);
    }
}
