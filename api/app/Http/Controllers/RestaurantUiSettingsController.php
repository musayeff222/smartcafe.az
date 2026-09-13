<?php

namespace App\Http\Controllers;

use App\Support\RestaurantUiDefaults;
use Illuminate\Http\Request;

class RestaurantUiSettingsController extends Controller
{
    public function show(Request $request)
    {
        $restaurant = $request->user()->restaurant;

        if (! $restaurant) {
            return response()->json(['message' => 'No restaurant associated with this user.'], 404);
        }

        return response()->json([
            'ui_settings' => RestaurantUiDefaults::merge($restaurant->ui_settings),
            'page_keys' => RestaurantUiDefaults::PAGE_KEYS,
            'feature_keys' => RestaurantUiDefaults::FEATURE_KEYS,
        ]);
    }

    public function update(Request $request)
    {
        $restaurant = $request->user()->restaurant;

        if (! $restaurant) {
            return response()->json(['message' => 'No restaurant associated with this user.'], 404);
        }

        $validated = $request->validate([
            'hidden_pages' => 'nullable|array',
            'hidden_pages.*' => 'string|in:' . implode(',', RestaurantUiDefaults::PAGE_KEYS),
            'hidden_features' => 'nullable|array',
            'hidden_features.*' => 'string|in:' . implode(',', RestaurantUiDefaults::FEATURE_KEYS),
            'options' => 'nullable|array',
            'options.siparisler_quick_sale_auto' => 'nullable|boolean',
            'screen_lock_idle_seconds' => 'nullable|integer|min:0|max:3600',
        ]);

        $settings = RestaurantUiDefaults::normalizeInput($validated);

        $restaurant->update(['ui_settings' => $settings]);

        return response()->json([
            'message' => 'UI settings updated.',
            'ui_settings' => $settings,
        ]);
    }
}
