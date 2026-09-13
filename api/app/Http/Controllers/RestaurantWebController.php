<?php

namespace App\Http\Controllers;

use App\Http\Requests\PublicWebOrderRequest;
use App\Http\Requests\UpdateRestaurantWebSettingsRequest;
use App\Models\Order;
use App\Models\QuickOrder;
use App\Models\Restaurant;
use App\Models\RestaurantWebSetting;
use App\Models\RestaurantWebPromoCode;
use App\Models\Stock;
use App\Models\StockDetail;
use App\Services\RestaurantWebPromoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RestaurantWebController extends Controller
{
    public function __construct(private RestaurantWebPromoService $promoService)
    {
    }

    public function showSettings(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        $settings = $this->getOrCreateSettings($restaurant);

        return response()->json($this->formatSettingsResponse($settings, $restaurant));
    }

    public function updateSettings(UpdateRestaurantWebSettingsRequest $request)
    {
        $restaurant = $request->user()->restaurant;
        $settings = $this->getOrCreateSettings($restaurant);
        $data = $request->validated();

        if (array_key_exists('custom_domain', $data)) {
            $domain = $data['custom_domain'] ? strtolower(trim($data['custom_domain'])) : null;
            if ($domain) {
                $domain = preg_replace('/^www\./', '', $domain);
            }
            $data['custom_domain'] = $domain;

            if ($domain !== $settings->custom_domain) {
                $data['domain_status'] = $domain ? 'pending' : 'none';
            } elseif ($domain && $settings->domain_status === 'rejected') {
                $data['domain_status'] = 'pending';
            }
        }

        if (isset($data['slug'])) {
            $data['slug'] = Str::slug($data['slug']);
        }

        $settings->update($data);

        return response()->json($this->formatSettingsResponse($settings->fresh(), $restaurant));
    }

    public function uploadBanner(Request $request)
    {
        $request->validate([
            'banner' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        $restaurant = $request->user()->restaurant;
        $settings = $this->getOrCreateSettings($restaurant);

        if ($settings->banner_path) {
            Storage::disk('public')->delete($settings->banner_path);
        }

        $image = $request->file('banner');
        $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
        $path = $image->storeAs('web_banners', $imageName, 'public');

        $settings->update(['banner_path' => $path]);

        return response()->json($this->formatSettingsResponse($settings->fresh(), $restaurant));
    }

    public function removeBanner(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        $settings = $this->getOrCreateSettings($restaurant);

        if ($settings->banner_path) {
            Storage::disk('public')->delete($settings->banner_path);
            $settings->update(['banner_path' => null]);
        }

        return response()->json($this->formatSettingsResponse($settings->fresh(), $restaurant));
    }

    public function publicMenu(string $slug)
    {
        $settings = RestaurantWebSetting::where('slug', $slug)
            ->where('is_active', true)
            ->with('restaurant')
            ->first();

        if (!$settings) {
            return response()->json(['error' => 'Web menu tapılmadı.'], 404);
        }

        return response()->json($this->buildMenuPayload($settings));
    }

    public function resolveByDomain(Request $request)
    {
        $host = strtolower(trim($request->query('host', $request->getHost())));
        $host = preg_replace('/:\d+$/', '', $host);
        $host = preg_replace('/^www\./', '', $host);

        if (in_array($host, ['localhost', '127.0.0.1', 'login.smartcafe.az'], true)) {
            return response()->json(['error' => 'Domain uyğun deyil.'], 404);
        }

        $settings = RestaurantWebSetting::where('custom_domain', $host)
            ->where('domain_status', 'active')
            ->where('is_active', true)
            ->with('restaurant')
            ->first();

        if (!$settings) {
            return response()->json(['error' => 'Domain aktiv deyil və ya tapılmadı.'], 404);
        }

        return response()->json(array_merge(
            ['slug' => $settings->slug],
            $this->buildMenuPayload($settings)
        ));
    }

    public function validatePromo(Request $request, string $slug)
    {
        $request->validate([
            'promo_code' => 'required|string|max:64',
            'stocks' => 'required|array|min:1',
            'stocks.*.stock_id' => 'required|integer',
            'stocks.*.quantity' => 'required|integer|min:1',
            'stocks.*.detail_id' => 'nullable|integer',
        ]);

        $settings = RestaurantWebSetting::where('slug', $slug)
            ->where('is_active', true)
            ->where('accept_orders', true)
            ->with('restaurant')
            ->first();

        if (!$settings) {
            return response()->json(['error' => 'Web sifariş qəbul edilmir.'], 400);
        }

        $quote = $this->promoService->buildQuote(
            $settings->restaurant,
            $request->input('stocks'),
            $request->input('promo_code')
        );

        if (!$quote['valid']) {
            return response()->json($quote, 422);
        }

        return response()->json($quote);
    }

    public function placeOrder(PublicWebOrderRequest $request, string $slug)
    {
        $settings = RestaurantWebSetting::where('slug', $slug)
            ->where('is_active', true)
            ->where('accept_orders', true)
            ->with('restaurant')
            ->first();

        if (!$settings) {
            return response()->json(['error' => 'Web sifariş qəbul edilmir.'], 400);
        }

        $restaurant = $settings->restaurant;
        $data = $request->validated();

        $subtotal = $this->promoService->calculateSubtotal($restaurant, $data['stocks']);

        if ($settings->min_order_amount && $subtotal < (float) $settings->min_order_amount) {
            return response()->json([
                'error' => 'Minimum sifariş məbləği: ' . number_format((float) $settings->min_order_amount, 2) . ' ₼',
            ], 422);
        }

        $promoDiscount = 0.0;
        $promoCode = null;

        if (!empty($data['promo_code'])) {
            $quote = $this->promoService->buildQuote($restaurant, $data['stocks'], $data['promo_code']);
            if (!$quote['valid']) {
                return response()->json(['error' => $quote['message'] ?? 'Promo kod etibarsızdır.'], 422);
            }
            $promoDiscount = $quote['discount'];
            $promoCode = $quote['code'];
        }

        DB::beginTransaction();

        try {
            $order = Order::create([
                'restaurant_id' => $restaurant->id,
                'status' => 'approved',
            ]);

            foreach ($data['stocks'] as $stockData) {
                $stock = Stock::where('restaurant_id', $restaurant->id)
                    ->where('show_on_qr', true)
                    ->find($stockData['stock_id']);

                if (!$stock) {
                    DB::rollBack();
                    return response()->json(['error' => 'Məhsul tapılmadı.'], 404);
                }

                $detailId = $stockData['detail_id'] ?? null;
                if ($detailId) {
                    $detail = StockDetail::where('id', $detailId)
                        ->where('stock_id', $stock->id)
                        ->first();

                    if (!$detail) {
                        DB::rollBack();
                        return response()->json(['error' => 'Yanlış variant seçildi.'], 400);
                    }
                }

                $order->stocks()->attach($stock->id, [
                    'quantity' => $stockData['quantity'],
                    'detail_id' => $detailId,
                ]);
            }

            $address = trim($data['address'] ?? '');
            if (!empty($data['latitude']) && !empty($data['longitude'])) {
                $lat = round((float) $data['latitude'], 6);
                $lng = round((float) $data['longitude'], 6);
                $maps = "https://www.google.com/maps?q={$lat},{$lng}";
                $locLine = "📍 Konum: {$lat}, {$lng} — {$maps}";
                $address = $address !== '' ? "{$address}\n\n{$locLine}" : $locLine;
            }

            $note = trim(($data['note'] ?? '') . ' [Web sifariş]');
            if ($promoCode && $promoDiscount > 0) {
                $note .= ' Promokod: ' . $promoCode . ' (-' . number_format($promoDiscount, 2) . ' ₼)';
            }

            $quickOrderData = [
                'restaurant_id' => $restaurant->id,
                'order_id' => $order->id,
                'name' => $data['name'],
                'phone' => $data['phone'],
                'address' => $address,
                'note' => $note,
            ];

            if (Schema::hasColumn('quick_orders', 'promo_code')) {
                $quickOrderData['promo_code'] = $promoCode;
                $quickOrderData['promo_discount'] = $promoDiscount;
            }

            QuickOrder::create($quickOrderData);

            if ($promoCode && Schema::hasTable('restaurant_web_promo_codes')) {
                RestaurantWebPromoCode::where('restaurant_id', $restaurant->id)
                    ->where('code', $promoCode)
                    ->increment('uses_count');
            }

            DB::commit();

            return response()->json([
                'message' => 'Sifarişiniz qəbul edildi.',
                'order_id' => $order->id,
                'subtotal' => $subtotal,
                'discount' => $promoDiscount,
                'total' => round(max(0, $subtotal - $promoDiscount), 2),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Web placeOrder failed', [
                'slug' => $slug,
                'restaurant_id' => $restaurant->id ?? null,
                'message' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Sifariş yaradıla bilmədi.'], 500);
        }
    }

    private function getOrCreateSettings(Restaurant $restaurant): RestaurantWebSetting
    {
        $existing = $restaurant->webSetting;
        if ($existing) {
            return $existing;
        }

        $baseSlug = Str::slug($restaurant->name) ?: 'restoran';
        $slug = $this->uniqueSlug($baseSlug);

        return RestaurantWebSetting::create([
            'restaurant_id' => $restaurant->id,
            'slug' => $slug,
            'web_title' => $restaurant->name,
            'is_active' => true,
            'accept_orders' => true,
        ]);
    }

    private function uniqueSlug(string $base): string
    {
        $slug = $base;
        $i = 1;
        while (RestaurantWebSetting::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i;
            $i++;
        }

        return $slug;
    }

    private function publicStorageUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        // Front öz img_url ilə qurur; burada yalnız path saxlanır (tam URL yaratmırıq)
        return str_replace('\\', '/', ltrim($path, '/'));
    }

    private function formatSettingsResponse(RestaurantWebSetting $settings, Restaurant $restaurant): array
    {
        return [
            'id' => $settings->id,
            'slug' => $settings->slug,
            'custom_domain' => $settings->custom_domain,
            'domain_status' => $settings->domain_status,
            'is_active' => $settings->is_active,
            'accept_orders' => $settings->accept_orders,
            'web_title' => $settings->web_title,
            'web_subtitle' => $settings->web_subtitle,
            'theme_color' => $settings->theme_color,
            'bg_color' => $settings->bg_color,
            'theme_template' => $settings->theme_template ?? 'classic',
            'banner_path' => $settings->banner_path,
            'banner_url' => $this->publicStorageUrl($settings->banner_path),
            'instagram_url' => $settings->instagram_url,
            'whatsapp' => $settings->whatsapp,
            'website_url' => $settings->website_url,
            'location_url' => $settings->location_url,
            'tiktok_url' => $settings->tiktok_url,
            'domain_note' => $settings->domain_note,
            'min_order_amount' => $settings->min_order_amount,
            'restaurant_name' => $restaurant->name,
            'restaurant_logo' => $restaurant->logo,
            'restaurant_logo_url' => $this->publicStorageUrl($restaurant->logo),
            'public_url_path' => '/menu/' . $settings->slug,
            'dns_hints' => [
                'cname_target' => config('web_menu.cname_target'),
                'server_ip' => config('web_menu.server_ip'),
            ],
        ];
    }

    private function buildMenuPayload(RestaurantWebSetting $settings): array
    {
        $restaurant = $settings->restaurant;

        $stockGroups = $restaurant->stockGroups()
            ->where('show_on_qr_menu', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->with(['stocks' => function ($query) {
                $query->where('show_on_qr', true)->with('details');
            }])
            ->get()
            ->map(function ($group) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'stocks' => $group->stocks->map(function ($stock) {
                        return [
                            'id' => $stock->id,
                            'name' => $stock->name,
                            'image' => $stock->image,
                            'description' => $stock->description,
                            'unit' => $stock->unit,
                            'price' => $stock->price,
                            'details' => $stock->details->map(fn ($d) => [
                                'id' => $d->id,
                                'price' => $d->price,
                                'unit' => $d->unit,
                                'count' => $d->count,
                            ]),
                        ];
                    }),
                ];
            });

        return [
            'settings' => [
                'slug' => $settings->slug,
                'web_title' => $settings->web_title ?: $restaurant->name,
                'web_subtitle' => $settings->web_subtitle,
                'theme_color' => $settings->theme_color,
                'bg_color' => $settings->bg_color,
                'theme_template' => $settings->theme_template ?? 'classic',
                'banner_path' => $settings->banner_path,
                'banner_url' => $this->publicStorageUrl($settings->banner_path),
                'instagram_url' => $settings->instagram_url,
                'whatsapp' => $settings->whatsapp,
                'website_url' => $settings->website_url,
                'location_url' => $settings->location_url,
                'tiktok_url' => $settings->tiktok_url,
                'accept_orders' => $settings->accept_orders,
                'min_order_amount' => $settings->min_order_amount,
            ],
            'restaurant' => [
                'name' => $restaurant->name,
                'logo' => $restaurant->logo,
                'logo_url' => $this->publicStorageUrl($restaurant->logo),
                'phone' => $restaurant->phone,
                'address' => $restaurant->address,
                'open_time' => $restaurant->open_time,
                'close_time' => $restaurant->close_time,
            ],
            'stockGroups' => $stockGroups,
        ];
    }
}
