<?php

namespace App\Http\Controllers;

use App\Models\MarketingPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class MarketingPlanController extends Controller
{
    public function index()
    {
        return MarketingPlan::query()->orderBy('sort_order')->orderBy('id')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:64|unique:marketing_plans,slug',
            'tag' => 'nullable|string|max:64',
            'pitch' => 'nullable|string|max:2000',
            'price_label' => 'nullable|string|max:255',
            'features' => 'nullable|array',
            'features.*' => 'string|max:500',
            'is_featured' => 'boolean',
            'sort_order' => 'integer|min:0|max:65535',
            'is_active' => 'boolean',
        ]);
        $slug = $data['slug'] ?? Str::slug($data['name']);
        if ($slug === '') {
            $slug = 'plan-'.Str::lower(Str::random(8));
        }
        $slug = Str::substr($slug, 0, 64);
        $base = $slug;
        $i = 1;
        while (MarketingPlan::query()->where('slug', $slug)->exists()) {
            $slug = Str::substr($base.'-'.$i, 0, 64);
            $i++;
        }
        $data['slug'] = $slug;
        $plan = MarketingPlan::query()->create($data + [
            'price_label' => $data['price_label'] ?? 'Fərdi təklif',
            'is_featured' => $data['is_featured'] ?? false,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);
        Cache::forget('marketing_page_v1');

        return response()->json($plan, 201);
    }

    public function show(MarketingPlan $plan)
    {
        return $plan;
    }

    public function update(Request $request, MarketingPlan $plan)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:64|unique:marketing_plans,slug,'.$plan->id,
            'tag' => 'nullable|string|max:64',
            'pitch' => 'nullable|string|max:2000',
            'price_label' => 'nullable|string|max:255',
            'features' => 'nullable|array',
            'features.*' => 'string|max:500',
            'is_featured' => 'boolean',
            'sort_order' => 'integer|min:0|max:65535',
            'is_active' => 'boolean',
        ]);
        $plan->update($data);
        Cache::forget('marketing_page_v1');

        return response()->json($plan);
    }

    public function destroy(MarketingPlan $plan)
    {
        $plan->delete();
        Cache::forget('marketing_page_v1');

        return response()->noContent();
    }
}
