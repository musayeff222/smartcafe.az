<?php

namespace App\Http\Controllers;

use App\Models\AdminNotification;
use App\Models\Payment;
use App\Models\Restaurant;
use App\Models\SystemBackup;
use App\Models\User;
use App\Models\WebsitePackage;
use App\Services\TelegramNotifier;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CrmController extends Controller
{
    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'pending_email' => $user->pending_email,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ]);
    }

    public function stats()
    {
        $active = Restaurant::query()
            ->where('is_active', 1)
            ->where(function ($q) {
                $q->whereNull('active_until')->orWhere('active_until', '>', now());
            });

        $paymentsMonth = 0;
        $paymentsToday = 0;
        try {
            $paymentsMonth = (float) Payment::query()
                ->where('created_at', '>=', now()->startOfMonth())
                ->sum('amount');
            $paymentsToday = (float) Payment::query()
                ->whereDate('created_at', now()->toDateString())
                ->sum('amount');
        } catch (\Throwable $e) {
        }

        $lastBackup = SystemBackup::query()->orderByDesc('id')->first();

        return response()->json([
            'restaurants_total' => Restaurant::count(),
            'restaurants_active' => (clone $active)->count(),
            'restaurants_new_7d' => Restaurant::where('created_at', '>=', now()->subDays(7))->count(),
            'users_total' => User::count(),
            'packages_total' => WebsitePackage::count(),
            'notifications_total' => AdminNotification::count(),
            'payments_today' => $paymentsToday,
            'payments_month' => $paymentsMonth,
            'backup' => $lastBackup ? [
                'status' => $lastBackup->status,
                'name' => $lastBackup->name,
                'finished_at' => $lastBackup->finished_at,
                'size_bytes' => $lastBackup->size_bytes,
            ] : null,
            'system' => [
                'app' => config('smartcafe.project_name'),
                'env' => config('app.env'),
                'telegram' => app(TelegramNotifier::class)->enabled(),
            ],
        ]);
    }

    public function roles()
    {
        $roles = Role::query()->with('permissions:id,name')->orderBy('name')->get()
            ->map(function (Role $role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'guard_name' => $role->guard_name,
                    'permissions' => $role->permissions->pluck('name')->values(),
                ];
            });

        $permissions = Permission::query()->orderBy('name')->pluck('name')->values();

        return response()->json([
            'roles' => $roles,
            'permissions' => $permissions,
            'note' => 'POS rolları (admin, waiter) restoran daxilindədir. CRM paneli hazırda super-admin üçündür.',
        ]);
    }
}
