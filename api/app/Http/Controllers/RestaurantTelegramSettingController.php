<?php

namespace App\Http\Controllers;

use App\Models\RestaurantTelegramSetting;
use App\Models\Table;
use App\Services\RestaurantTelegramDispatcher;
use App\Support\RestaurantTelegram;
use Illuminate\Http\Request;

class RestaurantTelegramSettingController extends Controller
{
    public function show(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        $restaurant->loadMissing('package');
        $settings = RestaurantTelegramSetting::query()->firstOrNew([
            'restaurant_id' => $restaurant->id,
        ]);

        return response()->json($this->payload($restaurant->hasTelegramBotFeature(), $settings));
    }

    public function update(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        $restaurant->loadMissing('package');
        if (!$restaurant->hasTelegramBotFeature()) {
            return response()->json([
                'message' => 'Telegram Bot bu restoranın tarifində aktiv deyil.',
                'available' => false,
            ], 403);
        }

        $data = $request->validate([
            'bot_token' => ['nullable', 'string', 'max:220'],
            'chat_id' => ['nullable', 'string', 'max:64', 'regex:/^-?\d+$/'],
            'is_enabled' => ['sometimes', 'boolean'],
            'notify_events' => ['nullable', 'array'],
            'daily_report_enabled' => ['sometimes', 'boolean'],
            'daily_report_time' => ['nullable', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
        ]);

        $settings = RestaurantTelegramSetting::query()->firstOrNew([
            'restaurant_id' => $restaurant->id,
        ]);
        $settings->restaurant_id = $restaurant->id;

        if (!empty($data['bot_token'])) {
            $token = preg_replace('/^bot/i', '', trim($data['bot_token']));
            if (!preg_match('/^\d+:[A-Za-z0-9_-]+$/', $token)) {
                return response()->json(['message' => 'Bot Token formatı yanlışdır.'], 422);
            }
            $settings->setEncryptedToken($token);
        }
        if (array_key_exists('chat_id', $data) && $data['chat_id'] !== null) {
            $settings->chat_id = $data['chat_id'];
        }
        if (array_key_exists('is_enabled', $data)) {
            $settings->is_enabled = (bool) $data['is_enabled'];
        }
        if (array_key_exists('notify_events', $data) && is_array($data['notify_events'])) {
            $events = RestaurantTelegramSetting::defaultEvents();
            foreach (array_keys(RestaurantTelegramSetting::CHANNELS) as $key) {
                if (array_key_exists($key, $data['notify_events'])) {
                    $events[$key] = (bool) $data['notify_events'][$key];
                }
            }
            $settings->notify_events = $events;
        }
        if (array_key_exists('daily_report_enabled', $data)) {
            $settings->daily_report_enabled = (bool) $data['daily_report_enabled'];
        }
        if (!empty($data['daily_report_time'])) {
            $settings->daily_report_time = $data['daily_report_time'];
        }
        if (!$settings->notify_events) {
            $settings->notify_events = RestaurantTelegramSetting::defaultEvents();
        }
        $settings->save();

        return response()->json([
            'message' => 'Telegram ayarları yadda saxlandı.',
            ...$this->payload(true, $settings->fresh()),
        ]);
    }

    public function test(Request $request, RestaurantTelegramDispatcher $dispatcher)
    {
        $restaurant = $request->user()->restaurant;
        $restaurant->loadMissing('package');
        if (!$restaurant->hasTelegramBotFeature()) {
            return response()->json(['message' => 'Telegram Bot tarifdə aktiv deyil.'], 403);
        }

        $settings = RestaurantTelegramSetting::query()
            ->where('restaurant_id', $restaurant->id)
            ->first();

        if (!$settings || !$settings->tokenConfigured() || trim((string) $settings->chat_id) === '') {
            return response()->json([
                'message' => 'Əvvəlcə Bot Token və Chat ID daxil edib yadda saxlayın.',
            ], 422);
        }

        $ok = $dispatcher->test($settings->fresh(), $restaurant->name);
        if (!$ok) {
            return response()->json([
                'message' => $settings->fresh()->last_error ?: 'Test mesajı getmədi.',
                ...$this->payload(true, $settings->fresh()),
            ], 422);
        }

        return response()->json([
            'message' => 'Test mesajı Telegram-a göndərildi.',
            ...$this->payload(true, $settings->fresh()),
        ]);
    }

    public function billPrinted(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        $data = $request->validate([
            'table_id' => ['required', 'integer'],
        ]);
        $table = Table::query()
            ->where('restaurant_id', $restaurant->id)
            ->find($data['table_id']);
        if (!$table) {
            return response()->json(['message' => 'Masa tapılmadı.'], 404);
        }

        RestaurantTelegram::billPrinted(
            $restaurant->id,
            (string) $table->name,
            $request->user()?->name
        );

        return response()->json(['ok' => true]);
    }

    private function payload(bool $available, RestaurantTelegramSetting $settings): array
    {
        $events = $settings->exists ? $settings->mergedEvents() : RestaurantTelegramSetting::defaultEvents();
        $connected = $available && $settings->ready() && $settings->last_ok_at && (
            !$settings->last_error_at || $settings->last_ok_at->gte($settings->last_error_at)
        );

        return [
            'available' => $available,
            'is_enabled' => (bool) $settings->is_enabled,
            'bot_token_set' => $settings->tokenConfigured(),
            'chat_id' => $settings->chat_id,
            'notify_events' => $events,
            'channels' => RestaurantTelegramSetting::CHANNELS,
            'daily_report_enabled' => (bool) $settings->daily_report_enabled,
            'daily_report_time' => $settings->daily_report_time ?: '22:00',
            'connection' => [
                'ready' => $available && $settings->ready(),
                'ok' => (bool) $connected,
                'last_ok_at' => $settings->last_ok_at,
                'last_error' => $available ? $settings->last_error : null,
                'last_error_at' => $settings->last_error_at,
            ],
        ];
    }
}
