<?php

namespace App\Http\Controllers;

use App\Models\AdminAuditLog;
use App\Models\AdminNotification;
use App\Models\AdminNotificationTarget;
use App\Models\Restaurant;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    public function index()
    {
        $items = AdminNotification::withCount('targets')
            ->with(['targets.restaurant:id,name', 'creator:id,name,email'])
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:180',
            'body' => 'required|string|max:4000',
            'restaurant_ids' => 'nullable|array',
            'restaurant_ids.*' => 'integer',
            'broadcast' => 'sometimes|boolean',
            'type' => 'nullable|in:info,success,warning,alert,promo',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'link' => 'nullable|url|max:500',
            'icon' => 'nullable|string|max:80',
            'filter' => 'nullable|array',
            'filter.status' => 'nullable|in:all,active,inactive',
        ]);

        $broadcast = (bool) ($data['broadcast'] ?? false);
        $ids = $data['restaurant_ids'] ?? [];
        $filter = $data['filter']['status'] ?? 'all';

        if ($broadcast) {
            $query = Restaurant::query();
            if ($filter === 'active') {
                $query->where('is_active', 1)->where(function ($q) {
                    $q->whereNull('active_until')->orWhere('active_until', '>', now());
                });
            } elseif ($filter === 'inactive') {
                $query->where(function ($q) {
                    $q->where('is_active', 0)->orWhere(function ($q2) {
                        $q2->whereNotNull('active_until')->where('active_until', '<=', now());
                    });
                });
            }
            $ids = $query->pluck('id')->all();
        }

        $ids = array_values(array_unique(array_map('intval', $ids)));
        if (!$ids) {
            return response()->json(['message' => 'Ən azı bir restoran seçin.'], 422);
        }

        $failed = 0;
        $valid = Restaurant::query()->whereIn('id', $ids)->pluck('id')->all();
        $failed = count($ids) - count($valid);
        $ids = $valid;

        if (!$ids) {
            return response()->json(['message' => 'Seçilmiş restoranlar tapılmadı.'], 422);
        }

        $notification = AdminNotification::create([
            'title' => $data['title'],
            'body' => $data['body'],
            'type' => $data['type'] ?? 'info',
            'priority' => $data['priority'] ?? 'normal',
            'link' => $data['link'] ?? null,
            'icon' => $data['icon'] ?? null,
            'created_by' => $request->user()?->id,
            'is_broadcast' => $broadcast || count($ids) > 1,
            'status' => $failed ? 'partial' : 'sent',
            'failed_count' => $failed,
        ]);

        foreach ($ids as $restaurantId) {
            AdminNotificationTarget::create([
                'notification_id' => $notification->id,
                'restaurant_id' => $restaurantId,
            ]);
        }

        try {
            AdminAuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'notification.sent',
                'restaurant_id' => count($ids) === 1 ? $ids[0] : null,
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 500),
                'meta' => [
                    'title' => $notification->title,
                    'count' => count($ids),
                    'failed' => $failed,
                    'broadcast' => $notification->is_broadcast,
                    'type' => $notification->type,
                    'priority' => $notification->priority,
                ],
            ]);
        } catch (\Exception $e) {
        }

        return response()->json([
            'message' => $failed ? 'Bildiriş qismən göndərildi.' : 'Bildiriş göndərildi.',
            'notification' => $notification->load(['targets', 'creator:id,name,email']),
            'sent' => count($ids),
            'failed' => $failed,
        ], 201);
    }

    public function inbox(Request $request)
    {
        $restaurantId = $request->user()?->restaurant_id;
        if (!$restaurantId) {
            return response()->json(['message' => 'No restaurant'], 403);
        }

        $rows = AdminNotificationTarget::with('notification')
            ->where('restaurant_id', $restaurantId)
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(function (AdminNotificationTarget $row) {
                return [
                    'id' => $row->id,
                    'notification_id' => $row->notification_id,
                    'title' => $row->notification?->title,
                    'body' => $row->notification?->body,
                    'type' => $row->notification?->type,
                    'priority' => $row->notification?->priority,
                    'link' => $row->notification?->link,
                    'read_at' => $row->read_at,
                    'created_at' => $row->notification?->created_at,
                ];
            });

        return response()->json([
            'unread' => $rows->whereNull('read_at')->count(),
            'items' => $rows->values(),
        ]);
    }

    public function markRead(Request $request, $id)
    {
        $restaurantId = $request->user()?->restaurant_id;
        $row = AdminNotificationTarget::where('id', $id)
            ->where('restaurant_id', $restaurantId)
            ->firstOrFail();

        if (!$row->read_at) {
            $row->read_at = now();
            $row->save();
        }

        return response()->json(['message' => 'Oxundu.']);
    }

    public function markAllRead(Request $request)
    {
        $restaurantId = $request->user()?->restaurant_id;
        AdminNotificationTarget::where('restaurant_id', $restaurantId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Hamısı oxundu.']);
    }
}
