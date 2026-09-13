<?php

namespace App\Http\Controllers;

use App\Models\AdminAuditLog;
use App\Models\WebsitePackage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WebsitePackageController extends Controller
{
    public function index()
    {
        return response()->json(
            WebsitePackage::query()->orderBy('sort_order')->orderBy('id')->get()
        );
    }

    public function store(Request $request)
    {
        $pkg = WebsitePackage::create($this->validated($request));
        $this->audit($request, 'package.create', $pkg->id);
        return response()->json(['message' => 'Paket yaradıldı.', 'package' => $pkg], 201);
    }

    public function update(Request $request, WebsitePackage $package)
    {
        $package->update($this->validated($request, $package->id));
        $this->audit($request, 'package.update', $package->id);
        return response()->json(['message' => 'Paket yeniləndi.', 'package' => $package]);
    }

    public function destroy(Request $request, WebsitePackage $package)
    {
        $id = $package->id;
        $package->delete();
        $this->audit($request, 'package.delete', $id);
        return response()->json(['message' => 'Paket silindi.']);
    }

    public function reorder(Request $request)
    {
        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);
        foreach (array_values($data['ids']) as $i => $id) {
            WebsitePackage::where('id', $id)->update(['sort_order' => $i]);
        }
        $this->audit($request, 'package.reorder');
        return response()->json(['message' => 'Sıra yeniləndi.']);
    }

    private function validated(Request $request, ?int $id = null): array
    {
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'slug' => 'nullable|string|max:120',
            'description' => 'nullable|string|max:4000',
            'price' => 'nullable|numeric|min:0',
            'old_price' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|integer|min:0|max:100',
            'badge' => 'nullable|string|max:40',
            'color' => 'nullable|string|max:24',
            'cta_text' => 'nullable|string|max:80',
            'cta_url' => 'nullable|string|max:255',
            'features' => 'nullable|array',
            'limits' => 'nullable|array',
            'limits.user_limit' => 'nullable|integer|min:0',
            'limits.storage_limit_mb' => 'nullable|integer|min:0',
            'limits.product_limit' => 'nullable|integer|min:0',
            'limits.staff_limit' => 'nullable|integer|min:0',
            'limits.order_limit' => 'nullable|integer|min:0',
            'limits.permissions' => 'nullable|array',
            'limits.telegram_bot' => 'nullable|boolean',
            'monthly_price' => 'nullable|numeric|min:0',
            'yearly_price' => 'nullable|numeric|min:0',
            'duration_days' => 'nullable|integer|min:0',
            'trial_days' => 'nullable|integer|min:0',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
        $data['features'] = array_values($data['features'] ?? []);
        $data['is_active'] = (bool) ($data['is_active'] ?? true);
        $data['sort_order'] = $data['sort_order'] ?? 0;

        return $data;
    }

    private function audit(Request $request, string $action, $target = null): void
    {
        try {
            AdminAuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => $action,
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 500),
                'meta' => $target ? ['id' => $target] : null,
            ]);
        } catch (\Exception $e) {
        }
    }
}
