<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Models\RestaurantSecuritySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class RestaurantSecuritySettingController extends Controller
{
    private function allowedKeys(): array
    {
        return config('smartcafe_security.categories', []);
    }

    private function defaults(): array
    {
        return config('smartcafe_security.defaults', []);
    }

    private function restaurant(Request $request): ?Restaurant
    {
        return $request->user()->loadMissing('restaurant')->restaurant;
    }

    /**
     * Bütün işçilər üçün: hansı qapıların aktiv olduğu və özəl pin olub-olmadığı (hash yox).
     */
    public function index(Request $request)
    {
        $restaurant = $this->restaurant($request);
        if (! $restaurant) {
            return response()->json(['message' => 'Restoran tapılmadı'], 404);
        }
        $rows = RestaurantSecuritySetting::query()
            ->where('restaurant_id', $restaurant->id)
            ->get()
            ->keyBy('category');

        $out = [];
        foreach ($this->allowedKeys() as $key) {
            $row = $rows->get($key);
            $out[] = [
                'key' => $key,
                'is_enabled' => $row ? (bool) $row->is_enabled : true,
                'has_custom_pin' => $row && $row->pin_hash !== null,
            ];
        }

        return response()->json(['categories' => $out]);
    }

    /**
     * Yalnız idarəçi: pin və aktiv/bağlı yeniləmə. Pin bcrypt ilə saxlanır (düz mətn yox).
     */
    public function update(Request $request)
    {
        $restaurant = $this->restaurant($request);
        if (! $restaurant) {
            return response()->json(['message' => 'Restoran tapılmadı'], 404);
        }
        $allowed = $this->allowedKeys();

        $validated = $request->validate([
            'categories' => 'required|array',
            'categories.*.key' => 'required|string|max:32',
            'categories.*.is_enabled' => 'sometimes|boolean',
            'categories.*.pin' => 'sometimes|nullable|string|regex:/^[0-9]{4,8}$/',
            'categories.*.reset_custom_pin' => 'sometimes|boolean',
        ]);

        foreach ($validated['categories'] as $item) {
            $key = $item['key'];
            if (! in_array($key, $allowed, true)) {
                continue;
            }

            $record = RestaurantSecuritySetting::firstOrCreate(
                [
                    'restaurant_id' => $restaurant->id,
                    'category' => $key,
                ],
                ['is_enabled' => true]
            );

            if (array_key_exists('is_enabled', $item)) {
                $record->is_enabled = (bool) $item['is_enabled'];
            }

            if (! empty($item['reset_custom_pin'])) {
                $record->pin_hash = null;
            } elseif (! empty($item['pin'])) {
                $record->pin_hash = Hash::make($item['pin']);
            }

            $record->save();
        }

        return $this->index($request);
    }

    /**
     * POS əməliyyatı üçün pin yoxlaması (hash müqayisəsi serverdə).
     */
    public function verify(Request $request)
    {
        $restaurant = $this->restaurant($request);
        if (! $restaurant) {
            return response()->json(['message' => 'Restoran tapılmadı'], 404);
        }
        $allowed = $this->allowedKeys();
        $defaults = $this->defaults();

        $validated = $request->validate([
            'category' => 'required|string|max:32',
            'attempt' => 'required|string|max:12',
        ]);

        $category = $validated['category'];
        if (! in_array($category, $allowed, true)) {
            return response()->json(['ok' => false, 'message' => 'Naməlum kateqoriya'], 422);
        }

        $row = RestaurantSecuritySetting::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('category', $category)
            ->first();

        if ($row && $row->is_enabled === false) {
            return response()->json(['ok' => true]);
        }

        $attempt = (string) $validated['attempt'];
        $default = (string) ($defaults[$category] ?? '');

        if ($row && $row->pin_hash) {
            $ok = Hash::check($attempt, $row->pin_hash);
        } else {
            $ok = $default !== '' && hash_equals($default, $attempt);
        }

        return response()->json(['ok' => $ok]);
    }
}
