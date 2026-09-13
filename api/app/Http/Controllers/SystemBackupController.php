<?php

namespace App\Http\Controllers;

use App\Models\AdminAuditLog;
use App\Models\SystemBackup;
use App\Services\BackupService;
use App\Services\TelegramNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SystemBackupController extends Controller
{
    public function index(BackupService $backups, TelegramNotifier $telegram)
    {
        $rows = SystemBackup::query()->orderByDesc('id')->limit(100)->get();
        $last = $rows->firstWhere('status', 'success') ?: $rows->first();

        return response()->json([
            'automatic' => true,
            'schedule' => '0 3 * * *',
            'last_backup_at' => $last?->finished_at,
            'next_backup_at' => $backups->nextScheduledAt(),
            'telegram_configured' => $telegram->enabled(),
            'telegram' => [
                'bot_token_configured' => $telegram->botToken() !== '',
                'chat_id' => $telegram->chatId(),
                'ready' => $telegram->enabled(),
            ],
            'items' => $rows,
        ]);
    }

    public function store(Request $request, BackupService $backups)
    {
        $validated = $request->validate([
            'label' => 'nullable|string|max:80',
            'name' => 'nullable|string|max:80',
        ]);
        $label = $validated['label'] ?? $validated['name'] ?? null;
        $row = $backups->run('manual', $request->user()?->id, $label);
        $this->audit($request, 'backup.create', $row->id, [
            'status' => $row->status,
            'label' => $row->label,
        ]);

        if ($row->status !== 'success') {
            return response()->json([
                'message' => 'Backup uğursuz oldu.',
                'backup' => $row,
            ], 500);
        }

        $tgSent = (bool) ($row->telegram_zip_sent ?? false);
        $tgError = $row->telegram_error ?? null;
        if ($tgSent) {
            $message = 'Backup hazırdır. ZIP Telegram-a göndərildi.';
        } elseif (app(TelegramNotifier::class)->enabled()) {
            $message = 'Backup hazırdır, amma ZIP Telegram-a getmədi'.($tgError ? ': '.$tgError : '.');
        } else {
            $message = 'Backup hazırdır. Telegram qoşulmayıb — ZIP göndərilmədi.';
        }

        return response()->json([
            'message' => $message,
            'telegram_zip_sent' => $tgSent,
            'telegram_error' => $tgError,
            'backup' => $row,
        ], 201);
    }

    public function download(Request $request, SystemBackup $backup, BackupService $backups)
    {
        if ($backup->status !== 'success' || !$backup->path || !$backups->isInsideBackupDir($backup->path) || !is_file($backup->path)) {
            return response()->json(['message' => 'Backup faylı tapılmadı.'], 404);
        }

        $this->audit($request, 'backup.download', $backup->id);

        return new StreamedResponse(function () use ($backup) {
            $stream = fopen($backup->path, 'rb');
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => 'application/octet-stream',
            'Content-Disposition' => 'attachment; filename="'.basename($backup->path).'"',
            'Content-Length' => (string) filesize($backup->path),
        ]);
    }

    public function destroy(Request $request, SystemBackup $backup, BackupService $backups)
    {
        $this->assertPassword($request);
        $id = $backup->id;
        $backups->deleteBackup($backup);
        $this->audit($request, 'backup.delete', $id);
        return response()->json(['message' => 'Backup silindi.']);
    }

    public function restore(Request $request, SystemBackup $backup, BackupService $backups)
    {
        $this->assertPassword($request);

        $confirm = mb_strtoupper(trim((string) $request->input('confirm', '')));
        $headerOk = $request->header('X-Confirm-Restore') === 'RESTORE';
        $phraseOk = in_array($confirm, ['BERPA', 'BƏRPA', 'RESTORE'], true);
        if (!$headerOk && !$phraseOk) {
            return response()->json(['message' => 'Təsdiq üçün BƏRPA yazın.'], 403);
        }

        if ($backup->status !== 'success') {
            return response()->json(['message' => 'Yalnız uğurlu backup bərpa edilə bilər.'], 422);
        }

        try {
            @set_time_limit(0);
            $backups->restore($backup);
            $this->audit($request, 'backup.restore', $backup->id, [
                'name' => $backup->name,
                'label' => $backup->label,
            ]);
        } catch (\Throwable $e) {
            $this->audit($request, 'backup.restore_failed', $backup->id, ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Bərpa alınmadı: '.$e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'Versiya bərpa olundu. Səhifəni yeniləyin; yenidən daxil olmaq lazım ola bilər.',
            'backup' => $backup->only(['id', 'name', 'label', 'status', 'size_bytes']),
        ]);
    }

    private function assertPassword(Request $request): void
    {
        $password = $request->input('password') ?: $request->header('X-Confirm-Password');
        if (!$password || !Hash::check($password, $request->user()->password)) {
            abort(response()->json(['message' => 'Super-admin şifrəsi tələb olunur.'], 403));
        }
    }

    private function audit(Request $request, string $action, $target = null, array $meta = []): void
    {
        try {
            AdminAuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => $action,
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 500),
                'meta' => array_filter(['id' => $target] + $meta),
            ]);
        } catch (\Exception $e) {
        }
    }
}
