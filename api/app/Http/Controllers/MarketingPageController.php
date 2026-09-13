<?php

namespace App\Http\Controllers;

use App\Models\MarketingPlan;
use App\Models\MarketingPromoCode;
use App\Models\MarketingSiteContent;
use App\Models\WebsitePackage;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class MarketingPageController extends Controller
{
    /**
     * İctimai marketing JSON (smartcafe.az statik səhifə üçün).
     */
    public function show()
    {
        return Cache::remember('marketing_page_v1', 60, function () {
            $row = MarketingSiteContent::query()->where('locale', 'az')->first();
            if (! $row) {
                $row = MarketingSiteContent::query()->create([
                    'locale' => 'az',
                    'payload' => MarketingSiteContent::defaultPayload(),
                ]);
            }

            $plans = MarketingPlan::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(['id', 'name', 'slug', 'tag', 'pitch', 'price_label', 'features', 'is_featured', 'sort_order']);

            if ($plans->isEmpty()) {
                $this->seedDefaultPlans();
                $plans = MarketingPlan::query()
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->get(['id', 'name', 'slug', 'tag', 'pitch', 'price_label', 'features', 'is_featured', 'sort_order']);
            }

            $now = Carbon::now();
            $promos = MarketingPromoCode::query()
                ->where('is_active', true)
                ->where('show_on_landing', true)
                ->where(function ($q) use ($now) {
                    $q->whereNull('valid_from')->orWhere('valid_from', '<=', $now);
                })
                ->where(function ($q) use ($now) {
                    $q->whereNull('valid_until')->orWhere('valid_until', '>=', $now);
                })
                ->orderBy('id')
                ->get(['id', 'code', 'title', 'description', 'discount_type', 'discount_value', 'marketing_plan_id']);

            return response()->json([
                'locale' => 'az',
                'content' => $row->payload,
                'plans' => $plans,
                'promos' => $promos,
                'packages' => $this->activePackages(),
            ]);
        });
    }

    public function packages()
    {
        return response()->json($this->activePackages());
    }

    private function activePackages()
    {
        if (! Schema::hasTable('website_packages')) {
            return [];
        }

        return WebsitePackage::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    protected function seedDefaultPlans(): void
    {
        $defaults = [
            [
                'name' => 'Başlanğıc',
                'slug' => 'baslangic',
                'tag' => 'Tək məkan',
                'pitch' => 'Kiçik kafe və tək zal üçün əsas idarəetmə.',
                'price_label' => 'Fərdi təklif',
                'features' => ['POS və masa ekranı', 'Əsas menyu', 'Gündəlik satış icmalı', 'Məhdud istifadəçi sayı'],
                'is_featured' => false,
                'sort_order' => 10,
            ],
            [
                'name' => 'Peşəkar',
                'slug' => 'pesekar',
                'tag' => 'Genişlənmiş',
                'pitch' => 'Orta restoran üçün tam idarəetmə və anbar.',
                'price_label' => 'Fərdi təklif',
                'features' => ['Başlanğıc planındakı hər şey', 'Anbar və xammal', 'Kassa və hesabatlar', 'PIN və rollar', 'Əlavə istifadəçi paketləri'],
                'is_featured' => true,
                'sort_order' => 20,
            ],
            [
                'name' => 'Korporativ',
                'slug' => 'korporativ',
                'tag' => 'Şəbəkə',
                'pitch' => 'Bir neçə filial və mərkəzi idarəetmə.',
                'price_label' => 'Fərdi təklif',
                'features' => ['Çox restoran strukturu', 'Super admin', 'Prioritet dəstək (SLA)', 'Xüsusi tələblər'],
                'is_featured' => false,
                'sort_order' => 30,
            ],
        ];
        foreach ($defaults as $d) {
            MarketingPlan::query()->firstOrCreate(['slug' => $d['slug']], $d + ['is_active' => true]);
        }
    }
}
