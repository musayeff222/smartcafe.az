<?php

namespace App\Http\Controllers;

use App\Models\AdminAuditLog;
use App\Models\WebsiteSetting;
use App\Services\TelegramNotifier;
use Illuminate\Http\Request;

class TelegramSettingsController extends Controller
{
    public function show(TelegramNotifier $telegram)
    {
        return response()->json($this->payload($telegram));
    }

    public function update(Request $request, TelegramNotifier $telegram)
    {
        $data = $request->validate([
            'chat_id' => ['required', 'string', 'max:64', 'regex:/^-?\d+$/'],
        ]);

        WebsiteSetting::updateOrCreate(
            ['key' => 'telegram.chat_id'],
            ['group' => 'telegram', 'value' => ['chat_id' => $data['chat_id']]]
        );

        try {
            AdminAuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'telegram.chat_id.update',
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 500),
            ]);
        } catch (\Exception $e) {
        }

        return response()->json([
            'message' => 'Telegram Chat ID yadda saxlandı.',
            ...$this->payload($telegram),
        ]);
    }

    public function test(TelegramNotifier $telegram)
    {
        if (!$telegram->botToken()) {
            return response()->json([
                'message' => 'Bot token hələ server .env-də yoxdur. Tokeni mənə göndərin, serverə yazım.',
            ], 422);
        }

        if (!$telegram->chatId()) {
            return response()->json([
                'message' => 'Əvvəlcə Chat ID daxil edib yadda saxlayın.',
            ], 422);
        }

        $ok = $telegram->sendMessage(implode("\n", [
            'SMARTCAFE TEST',
            'Project: '.config('smartcafe.project_name'),
            'Server: '.config('smartcafe.server_name'),
            'Time: '.now()->format('Y-m-d H:i:s'),
            'Chat ID qoşuldu.',
            'Backup-lar ZIP faylı kimi göndəriləcək.',
        ]));

        if (!$ok) {
            return response()->json([
                'message' => 'Mesaj getmədi. Botu chat-ə əlavə edin və Chat ID-ni yoxlayın.',
            ], 422);
        }

        return response()->json(['message' => 'Test mesajı Telegram-a göndərildi.']);
    }

    private function payload(TelegramNotifier $telegram): array
    {
        return [
            'bot_token_configured' => $telegram->botToken() !== '',
            'chat_id' => $telegram->chatId(),
            'ready' => $telegram->enabled(),
        ];
    }
}
