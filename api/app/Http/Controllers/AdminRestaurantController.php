<?php

namespace App\Http\Controllers;

use App\Models\AdminAuditLog;
use App\Models\AdminRestaurantNote;
use App\Models\Payment;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

/**
 * Extra super-admin endpoints supporting the new CRM UI.
 *
 * These are additive — legacy endpoints in SuperAdminController continue to
 * work. New endpoints are guarded by auth:sanctum + role:super-admin at the
 * route layer.
 */
class AdminRestaurantController extends Controller
{
    /**
     * Aggregate summary for the new restaurant detail page.
     */
    public function summary(Request $request, int $id)
    {
        $restaurant = Restaurant::with('package:id,name,limits')->findOrFail($id);

        $users = $restaurant->users()->with('roles:id,name')->get()->map(function (User $u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'is_active' => (bool) ($u->is_active ?? true),
                'active_until' => $u->active_until,
                'roles' => method_exists($u, 'getRoleNames') ? $u->getRoleNames() : [],
                'created_at' => $u->created_at,
            ];
        });

        $adminUser = $restaurant->users()
            ->whereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->first();

        // Best-effort revenue calculation. Payment table may or may not have restaurant_id;
        // if the column is missing we join through orders.
        $revenue30 = 0;
        $orders30 = 0;
        try {
            if (Schema::hasColumn('payments', 'restaurant_id')) {
                $revenue30 = (float) Payment::query()
                    ->where('restaurant_id', $id)
                    ->where('created_at', '>=', now()->subDays(30))
                    ->sum('amount');
            } elseif (Schema::hasTable('orders') && Schema::hasColumn('orders', 'restaurant_id')) {
                $revenue30 = (float) DB::table('payments')
                    ->join('orders', 'payments.order_id', '=', 'orders.id')
                    ->where('orders.restaurant_id', $id)
                    ->where('payments.created_at', '>=', now()->subDays(30))
                    ->sum('payments.amount');
            }
        } catch (\Throwable $e) {
            $revenue30 = 0;
        }

        try {
            if (Schema::hasColumn('orders', 'restaurant_id')) {
                $orders30 = (int) DB::table('orders')
                    ->where('restaurant_id', $id)
                    ->where('created_at', '>=', now()->subDays(30))
                    ->count();
            }
        } catch (\Throwable $e) {
            $orders30 = 0;
        }

        $lastLogin = null;
        try {
            $lastLogin = DB::table('personal_access_tokens')
                ->whereIn('tokenable_id', $users->pluck('id')->all())
                ->where('tokenable_type', User::class)
                ->orderByDesc('last_used_at')
                ->value('last_used_at');
        } catch (\Throwable $e) {
        }

        $audit = AdminAuditLog::query()
            ->where('restaurant_id', $id)
            ->orderByDesc('id')
            ->limit(20)
            ->get();

        $recentOrders = [];
        try {
            if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'restaurant_id')) {
                $recentOrders = DB::table('orders')
                    ->where('restaurant_id', $id)
                    ->orderByDesc('id')
                    ->limit(20)
                    ->get();
            }
        } catch (\Throwable $e) {
            $recentOrders = [];
        }

        return response()->json([
            'restaurant' => $restaurant,
            'admin' => $adminUser,
            'users' => $users,
            'stats' => [
                'users_count' => $users->count(),
                'orders_30d' => $orders30,
                'revenue_30d' => $revenue30,
                'last_login_at' => $lastLogin,
            ],
            'audit' => $audit,
            'orders' => $recentOrders,
        ]);
    }

    /**
     * List internal admin-only notes for a restaurant.
     */
    public function notesIndex(Request $request, int $id)
    {
        Restaurant::findOrFail($id);
        $notes = AdminRestaurantNote::with('user:id,name,email')
            ->where('restaurant_id', $id)
            ->orderByDesc('id')
            ->get();
        return response()->json($notes);
    }

    /**
     * Add a new admin-only note.
     */
    public function notesStore(Request $request, int $id)
    {
        $data = $request->validate([
            'note' => 'required|string|max:5000',
        ]);
        Restaurant::findOrFail($id);
        $note = AdminRestaurantNote::create([
            'restaurant_id' => $id,
            'user_id' => $request->user()?->id,
            'note' => $data['note'],
        ]);
        return response()->json($note->load('user:id,name,email'), 201);
    }

    /**
     * Delete a note.
     */
    public function notesDestroy(Request $request, int $id, int $noteId)
    {
        $note = AdminRestaurantNote::where('restaurant_id', $id)
            ->where('id', $noteId)
            ->firstOrFail();
        $note->delete();
        return response()->json(['message' => 'Silindi.']);
    }

    /**
     * Reset a restaurant admin's password. Requires super-admin's current
     * password to prevent accidental resets.
     */
    public function resetPassword(Request $request, int $id)
    {
        $data = $request->validate([
            'password' => 'required|string|min:6|max:100',
            'confirm_password' => 'nullable|string',
        ]);

        $confirm = $data['confirm_password'] ?? $request->header('X-Confirm-Password');
        if (!$confirm) {
            return response()->json(['message' => 'Super-admin şifrəsi tələb olunur.'], 403);
        }
        if (!Hash::check($confirm, $request->user()->password)) {
            return response()->json(['message' => 'Super-admin şifrəsi yanlışdır.'], 403);
        }

        $restaurant = Restaurant::findOrFail($id);
        $admin = $restaurant->users()
            ->whereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->first();
        if (!$admin) {
            return response()->json(['message' => 'Restoranın admin istifadəçisi tapılmadı.'], 404);
        }

        $admin->password = bcrypt($data['password']);
        $admin->save();
        $admin->tokens()->delete();

        try {
            AdminAuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'restaurant.password_reset',
                'restaurant_id' => $restaurant->id,
                'restaurant_name' => $restaurant->name,
                'restaurant_email' => $restaurant->email,
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 500),
                'meta' => ['admin_email' => $admin->email],
            ]);
        } catch (\Throwable $e) {
        }

        return response()->json(['message' => 'Şifrə sıfırlandı.']);
    }

    /**
     * Bulk update selected restaurants — supports:
     *  - action=activate|deactivate|extend
     *  - extend_days: integer (30/90/180/365)
     */
    public function bulkUpdate(Request $request)
    {
        $data = $request->validate([
            'restaurant_ids' => 'required|array|min:1',
            'restaurant_ids.*' => 'integer',
            'action' => 'required|in:activate,deactivate,extend',
            'extend_days' => 'nullable|integer|min:1|max:3650',
        ]);

        $ids = array_values(array_unique(array_map('intval', $data['restaurant_ids'])));
        $affected = 0;

        DB::beginTransaction();
        try {
            foreach ($ids as $rid) {
                $r = Restaurant::find($rid);
                if (!$r) continue;
                if ($data['action'] === 'activate') {
                    $r->is_active = true;
                    $r->save();
                } elseif ($data['action'] === 'deactivate') {
                    $r->is_active = false;
                    $r->save();
                } elseif ($data['action'] === 'extend') {
                    $days = (int) ($data['extend_days'] ?? 30);
                    $base = $r->active_until && strtotime($r->active_until) > time()
                        ? \Carbon\Carbon::parse($r->active_until)
                        : now();
                    $r->active_until = $base->addDays($days);
                    if (!$r->is_active) $r->is_active = true;
                    $r->save();
                }
                $affected++;
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Toplu əməliyyat alınmadı.'], 422);
        }

        try {
            AdminAuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'restaurant.bulk_' . $data['action'],
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 500),
                'meta' => [
                    'ids' => $ids,
                    'affected' => $affected,
                    'extend_days' => $data['extend_days'] ?? null,
                ],
            ]);
        } catch (\Throwable $e) {
        }

        return response()->json([
            'message' => 'Əməliyyat tamamlandı.',
            'affected' => $affected,
        ]);
    }
}
