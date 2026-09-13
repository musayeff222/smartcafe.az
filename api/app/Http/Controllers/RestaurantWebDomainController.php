<?php

namespace App\Http\Controllers;

use App\Models\RestaurantWebSetting;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RestaurantWebDomainController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');

        $query = RestaurantWebSetting::query()
            ->with('restaurant:id,name,phone,is_active')
            ->whereNotNull('custom_domain')
            ->orderByRaw("FIELD(domain_status, 'pending', 'active', 'rejected', 'none')")
            ->orderByDesc('updated_at');

        if ($status && $status !== 'all') {
            $query->where('domain_status', $status);
        }

        return response()->json(
            $query->get()->map(fn (RestaurantWebSetting $s) => $this->formatRow($s))
        );
    }

    public function update(Request $request, RestaurantWebSetting $webSetting)
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['activate', 'disconnect', 'reject'])],
            'admin_note' => 'nullable|string|max:2000',
        ]);

        if (! $webSetting->custom_domain) {
            return response()->json(['message' => 'Bu restoran üçün domain qeydi yoxdur.'], 422);
        }

        switch ($data['action']) {
            case 'activate':
                $webSetting->update(['domain_status' => 'active']);
                break;

            case 'disconnect':
                $webSetting->update([
                    'domain_status' => 'none',
                    'custom_domain' => null,
                    'domain_note' => null,
                ]);
                break;

            case 'reject':
                $note = trim($data['admin_note'] ?? '');
                $webSetting->update([
                    'domain_status' => 'rejected',
                    'domain_note' => $note !== ''
                        ? $note
                        : $webSetting->domain_note,
                ]);
                break;
        }

        return response()->json($this->formatRow($webSetting->fresh()->load('restaurant:id,name,phone,is_active')));
    }

    private function formatRow(RestaurantWebSetting $settings): array
    {
        $restaurant = $settings->restaurant;

        return [
            'id' => $settings->id,
            'restaurant_id' => $settings->restaurant_id,
            'restaurant_name' => $restaurant?->name,
            'restaurant_phone' => $restaurant?->phone,
            'restaurant_active' => (bool) ($restaurant?->is_active),
            'slug' => $settings->slug,
            'custom_domain' => $settings->custom_domain,
            'domain_status' => $settings->domain_status,
            'domain_note' => $settings->domain_note,
            'is_active' => $settings->is_active,
            'public_path' => '/menu/' . $settings->slug,
            'updated_at' => $settings->updated_at?->toIso8601String(),
            'dns_hints' => [
                'cname_target' => config('web_menu.cname_target'),
                'server_ip' => config('web_menu.server_ip'),
            ],
        ];
    }
}
