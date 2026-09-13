<?php

namespace App\Services;

use App\Support\ExternalHttpClient;

class WoltMenuImportService
{
    private function headers(): array
    {
        return [
            'User-Agent' => 'Mozilla/5.0 (compatible; SmartCafe/1.0)',
            'Origin' => 'https://wolt.com',
            'Referer' => 'https://wolt.com/',
            'Accept' => 'application/json',
        ];
    }

    private function http(int $timeout = 25): \Illuminate\Http\Client\PendingRequest
    {
        return ExternalHttpClient::make($this->headers(), $timeout);
    }

    public function extractSlug(string $input): ?string
    {
        $input = trim($input);

        if (preg_match('#/restaurant/([a-z0-9_-]+)#i', $input, $matches)) {
            return strtolower($matches[1]);
        }

        if (preg_match('#^[\w-]+$#', $input)) {
            return strtolower($input);
        }

        return null;
    }

    public function fetchMenu(string $urlOrSlug): array
    {
        $slug = $this->extractSlug($urlOrSlug);

        if (!$slug) {
            throw new \InvalidArgumentException('Wolt restoran linki və ya slug düzgün deyil.');
        }

        $venueId = $this->resolveVenueId($slug);
        $menu = $this->fetchMenuData($venueId);

        return $this->normalizeMenu($menu, $slug, $venueId);
    }

    private function resolveVenueId(string $slug): string
    {
        $response = $this->http(25)
            ->get("https://consumer-api.wolt.com/order-xp/web/v1/venue/slug/{$slug}/dynamic/", [
                'selected_delivery_method' => 'homedelivery',
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Wolt restoranı tapılmadı.');
        }

        $venueId = $response->json('venue.id');

        if (!$venueId) {
            throw new \RuntimeException('Wolt restoran ID alınmadı.');
        }

        return $venueId;
    }

    private function fetchMenuData(string $venueId): array
    {
        $response = $this->http(30)
            ->get("https://restaurant-api.wolt.com/v4/venues/{$venueId}/menu/data", [
                'unit_prices' => 'true',
                'show_subcategories' => 'true',
            ]);

        if (!$response->successful() || empty($response->body())) {
            throw new \RuntimeException('Wolt menyusu yüklənmədi.');
        }

        return $response->json();
    }

    private function normalizeMenu(array $menu, string $slug, string $venueId): array
    {
        $categoriesById = collect($menu['categories'] ?? [])->keyBy('id');

        $items = collect($menu['items'] ?? [])
            ->filter(fn ($item) => ($item['enabled'] ?? true) && !empty($item['name']));

        $grouped = [];

        foreach ($items as $item) {
            $catId = $item['category'] ?? 'uncategorized';
            $catName = $categoriesById[$catId]['name'] ?? 'Digər';

            if (!isset($grouped[$catId])) {
                $grouped[$catId] = [
                    'wolt_id' => $catId,
                    'name' => $catName,
                    'items' => [],
                ];
            }

            $basePrice = (int) ($item['baseprice'] ?? 0);
            $originalPrice = isset($item['original_price']) ? (int) $item['original_price'] : null;

            $grouped[$catId]['items'][] = [
                'wolt_id' => $item['id'],
                'name' => $item['name'],
                'description' => $item['description'] ?? null,
                'price' => round($basePrice / 100, 2),
                'original_price' => $originalPrice !== null ? round($originalPrice / 100, 2) : null,
                'image_url' => $item['image'] ?? ($item['images'][0]['url'] ?? null),
            ];
        }

        $categories = array_values($grouped);
        usort($categories, fn ($a, $b) => strcmp($a['name'], $b['name']));

        return [
            'slug' => $slug,
            'venue_id' => $venueId,
            'venue_name' => $menu['name'] ?? $slug,
            'language' => $menu['language'] ?? 'az',
            'categories' => $categories,
            'total_items' => $items->count(),
            'total_categories' => count($categories),
        ];
    }
}
