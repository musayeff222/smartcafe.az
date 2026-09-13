<?php

namespace App\Support;

class RestaurantUiDefaults
{
    public const PAGE_KEYS = [
        'panel',
        'masalar',
        'siparisler',
        'musteriler',
        'gunluk_kasa',
        'stok',
        'material',
        'stocksadd',
        'personel',
        'couriers',
        'masa_tanimlari',
        'expenses',
    ];

    public const FEATURE_KEYS = [
        'siparisler_quick_sale',
    ];

    public const OPTION_KEYS = [
        'siparisler_quick_sale_auto',
    ];

    public static function defaults(): array
    {
        return [
            'hidden_pages' => [],
            'hidden_features' => [],
            'options' => [
                'siparisler_quick_sale_auto' => false,
            ],
            'screen_lock_idle_seconds' => 0,
        ];
    }

    public static function merge(?array $stored): array
    {
        $base = self::defaults();
        if (! is_array($stored)) {
            return $base;
        }

        $hiddenPages = array_values(array_intersect(
            $stored['hidden_pages'] ?? [],
            self::PAGE_KEYS
        ));

        $hiddenFeatures = array_values(array_intersect(
            $stored['hidden_features'] ?? [],
            self::FEATURE_KEYS
        ));

        $options = self::defaults()['options'];
        if (isset($stored['options']) && is_array($stored['options'])) {
            foreach (self::OPTION_KEYS as $key) {
                if (array_key_exists($key, $stored['options'])) {
                    $options[$key] = (bool) $stored['options'][$key];
                }
            }
        }

        return [
            'hidden_pages' => $hiddenPages,
            'hidden_features' => $hiddenFeatures,
            'options' => $options,
        ];
    }

    public static function normalizeInput(array $input): array
    {
        $merged = self::merge([
            'hidden_pages' => $input['hidden_pages'] ?? [],
            'hidden_features' => $input['hidden_features'] ?? [],
            'options' => $input['options'] ?? [],
        ]);

        if (isset($input['options']) && is_array($input['options'])) {
            foreach (self::OPTION_KEYS as $key) {
                if (array_key_exists($key, $input['options'])) {
                    $merged['options'][$key] = (bool) $input['options'][$key];
                }
            }
        }

        if (array_key_exists('screen_lock_idle_seconds', $input)) {
            $idle = (int) $input['screen_lock_idle_seconds'];
            $merged['screen_lock_idle_seconds'] = max(0, min(3600, $idle));
        }

        return $merged;
    }
}
