<?php

namespace App\Http\Controllers;

use App\Models\MarketingSiteContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MarketingSiteContentController extends Controller
{
    public function show()
    {
        $row = MarketingSiteContent::query()->where('locale', 'az')->first();
        if (! $row) {
            $row = MarketingSiteContent::query()->create([
                'locale' => 'az',
                'payload' => MarketingSiteContent::defaultPayload(),
            ]);
        }

        return response()->json($row);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'payload' => 'required|array',
            'payload.eyebrow' => 'nullable|string|max:255',
            'payload.hero_title' => 'nullable|string|max:500',
            'payload.hero_lead' => 'nullable|string|max:2000',
            'payload.contact_email' => 'nullable|string|max:255',
            'payload.login_url' => 'nullable|string|max:500',
            'payload.pricing_intro' => 'nullable|string|max:2000',
            'payload.faq' => 'nullable|array',
            'payload.faq.*.q' => 'nullable|string|max:500',
            'payload.faq.*.a' => 'nullable|string|max:2000',
        ]);

        $row = MarketingSiteContent::query()->firstOrCreate(
            ['locale' => 'az'],
            ['payload' => MarketingSiteContent::defaultPayload()]
        );
        $row->payload = array_replace(
            MarketingSiteContent::defaultPayload(),
            array_merge($row->payload ?? [], $data['payload'])
        );
        $row->save();
        Cache::forget('marketing_page_v1');

        return response()->json($row);
    }
}
