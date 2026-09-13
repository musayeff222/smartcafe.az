<?php

namespace App\Http\Controllers;

use App\Models\Stock;
use App\Models\StockGroup;
use App\Services\WoltMenuImportService;
use App\Support\ExternalHttpClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WoltMenuImportController extends Controller
{
    public function __construct(private WoltMenuImportService $woltService)
    {
    }

    public function preview(Request $request)
    {
        $request->validate([
            'url' => 'required|string|max:500',
        ]);

        try {
            $menu = $this->woltService->fetchMenu($request->input('url'));

            return response()->json($menu);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Wolt menyusu oxunmadı: ' . $e->getMessage()], 502);
        }
    }

    public function import(Request $request)
    {
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        $validated = $request->validate([
            'url' => 'required|string|max:500',
            'show_on_qr' => 'nullable|boolean',
            'default_amount' => 'nullable|integer|min:0|max:999999',
            'skip_existing' => 'nullable|boolean',
            'download_images' => 'nullable|boolean',
            'item_ids' => 'nullable|array',
            'item_ids.*' => 'string|max:64',
        ]);

        $restaurant = $request->user()->restaurant;

        if (!$restaurant) {
            return response()->json(['message' => 'User does not have an associated restaurant.'], 403);
        }

        try {
            $menu = $this->woltService->fetchMenu($validated['url']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Wolt menyusu oxunmadı: ' . $e->getMessage()], 502);
        }

        $showOnQr = $validated['show_on_qr'] ?? true;
        $defaultAmount = $validated['default_amount'] ?? 999;
        $skipExisting = $validated['skip_existing'] ?? true;
        $downloadImages = $validated['download_images'] ?? true;
        $selectedIds = collect($validated['item_ids'] ?? [])->filter()->values()->all();
        $filterBySelection = count($selectedIds) > 0;

        $existingNames = Stock::where('restaurant_id', $restaurant->id)
            ->pluck('name')
            ->map(fn ($n) => Str::lower(trim($n)))
            ->flip()
            ->all();

        $groupsByName = StockGroup::where('restaurant_id', $restaurant->id)
            ->get()
            ->keyBy(fn ($g) => Str::lower(trim($g->name)));

        $stats = [
            'groups_created' => 0,
            'imported' => 0,
            'skipped' => 0,
            'failed' => 0,
        ];

        DB::beginTransaction();

        try {
            foreach ($menu['categories'] as $category) {
                $groupKey = Str::lower(trim($category['name']));
                $group = $groupsByName[$groupKey] ?? null;

                if (!$group) {
                    $maxOrder = StockGroup::where('restaurant_id', $restaurant->id)->max('sort_order');
                    $group = StockGroup::create([
                        'restaurant_id' => $restaurant->id,
                        'name' => $category['name'],
                        'sort_order' => ($maxOrder ?? 0) + 1,
                        'show_on_qr_menu' => $showOnQr,
                    ]);
                    $groupsByName[$groupKey] = $group;
                    $stats['groups_created']++;
                }

                foreach ($category['items'] as $item) {
                    if ($filterBySelection && !in_array($item['wolt_id'], $selectedIds, true)) {
                        continue;
                    }

                    $nameKey = Str::lower(trim($item['name']));

                    if ($skipExisting && isset($existingNames[$nameKey])) {
                        $stats['skipped']++;
                        continue;
                    }

                    try {
                        $imagePath = null;
                        if ($downloadImages && !empty($item['image_url'])) {
                            $imagePath = $this->downloadImage($item['image_url'], $restaurant->id);
                        }

                        Stock::create([
                            'restaurant_id' => $restaurant->id,
                            'stock_group_id' => $group->id,
                            'name' => $item['name'],
                            'description' => $item['description'],
                            'image' => $imagePath,
                            'show_on_qr' => $showOnQr,
                            'price' => $item['price'],
                            'amount' => $defaultAmount,
                            'critical_amount' => 1,
                            'alert_critical' => false,
                        ]);

                        $existingNames[$nameKey] = true;
                        $stats['imported']++;
                    } catch (\Throwable $e) {
                        $stats['failed']++;
                    }
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Import zamanı xəta: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'Menyu import edildi.',
            'venue_name' => $menu['venue_name'],
            'stats' => $stats,
        ]);
    }

    private function downloadImage(string $url, int $restaurantId): ?string
    {
        if (!str_starts_with($url, 'http')) {
            return null;
        }

        try {
            $response = ExternalHttpClient::make([], 8)->get($url);

            if (!$response->successful()) {
                return null;
            }

            $contentType = $response->header('Content-Type') ?? '';
            $ext = 'jpg';

            if (str_contains($contentType, 'png')) {
                $ext = 'png';
            } elseif (str_contains($contentType, 'webp')) {
                $ext = 'webp';
            }

            $path = $restaurantId . '/stock_images/wolt_' . uniqid() . '.' . $ext;
            Storage::disk('public')->put($path, $response->body());

            return $path;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
