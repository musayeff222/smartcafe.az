<?php

namespace App\Services;

use App\Models\WebsiteSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramNotifier
{
    public function botToken(): string
    {
        return trim((string) config('smartcafe.telegram.bot_token'));
    }

    public function chatId(): string
    {
        $fromPanel = WebsiteSetting::scalar('telegram.chat_id');
        $id = $fromPanel !== null && $fromPanel !== ''
            ? $fromPanel
            : config('smartcafe.telegram.chat_id');

        return trim((string) $id);
    }

    public function enabled(): bool
    {
        return $this->botToken() !== '' && $this->chatId() !== '';
    }

    public function maxFileBytes(): int
    {
        return max(1, (int) config('smartcafe.telegram.max_file_mb', 49)) * 1024 * 1024;
    }

    public function sendMessage(string $text): bool
    {
        if (!$this->enabled()) {
            return false;
        }

        try {
            $response = Http::timeout(20)->post($this->api('sendMessage'), [
                'chat_id' => $this->chatId(),
                'text' => $text,
                'disable_web_page_preview' => true,
            ]);

            if (!$response->successful()) {
                Log::warning('Telegram sendMessage failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('Telegram sendMessage exception: '.$e->getMessage());
            return false;
        }
    }

    public function sendDocument(string $path, string $caption = ''): bool
    {
        if (!$this->enabled() || !is_file($path) || !is_readable($path)) {
            Log::warning('Telegram sendDocument skipped', [
                'path' => $path,
                'exists' => is_file($path),
            ]);
            return false;
        }

        $size = (int) filesize($path);
        if ($size <= 0 || $size > $this->maxFileBytes()) {
            Log::warning('Telegram sendDocument size rejected', [
                'file' => basename($path),
                'size' => $size,
                'max' => $this->maxFileBytes(),
            ]);
            return false;
        }

        $stream = fopen($path, 'rb');
        if ($stream === false) {
            return false;
        }

        try {
            $response = Http::timeout(180)
                ->attach(
                    'document',
                    $stream,
                    basename($path),
                    ['Content-Type' => 'application/octet-stream']
                )
                ->post($this->api('sendDocument'), [
                    'chat_id' => $this->chatId(),
                    'caption' => mb_substr($caption, 0, 1024),
                ]);

            if (!$response->successful()) {
                Log::warning('Telegram sendDocument failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'file' => basename($path),
                    'size' => $size,
                ]);
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('Telegram sendDocument exception: '.$e->getMessage(), [
                'file' => basename($path),
            ]);
            return false;
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }
    }

    public function sendBackupZip(string $path, array $payload = []): array
    {
        if (!$this->enabled()) {
            return ['ok' => false, 'parts' => 0, 'error' => 'Telegram qoşulmayıb (token və ya Chat ID).'];
        }

        if (!is_file($path)) {
            return ['ok' => false, 'parts' => 0, 'error' => 'ZIP faylı tapılmadı.'];
        }

        $name = $payload['name'] ?? basename($path);
        $caption = implode("\n", array_filter([
            'SmartCafe backup (ZIP)',
            'Fayl: '.$name,
            !empty($payload['size']) ? 'Ölçü: '.$payload['size'] : null,
            !empty($payload['date'])
                ? 'Vaxt: '.$payload['date'].' '.($payload['time'] ?? '')
                : null,
            'Server: '.($payload['server'] ?? config('smartcafe.server_name')),
        ]));

        $size = (int) filesize($path);
        $max = $this->maxFileBytes();

        if ($size <= $max) {
            $ok = $this->sendDocument($path, $caption);
            return $ok
                ? ['ok' => true, 'parts' => 1, 'error' => null]
                : ['ok' => false, 'parts' => 0, 'error' => 'ZIP Telegram-a göndərilmədi.'];
        }

        $parts = (int) ceil($size / $max);
        $this->sendMessage($caption."\n\nZIP ".$parts." hissəyə bölünür — hər hissəni yükləyin.");

        return $this->sendDocumentParts($path, $caption, $max);
    }

    public function backupSuccess(array $payload): array
    {
        $path = (string) ($payload['path'] ?? '');
        if ($path !== '' && is_file($path)) {
            return $this->sendBackupZip($path, $payload);
        }

        $this->sendMessage(implode("\n", [
            'BACKUP OK — ZIP tapılmadı',
            'Name: '.($payload['name'] ?? '-'),
            'Size: '.($payload['size'] ?? '-'),
        ]));

        return ['ok' => false, 'parts' => 0, 'error' => 'ZIP faylı yoxdur'];
    }

    public function backupFailed(array $payload): void
    {
        $this->sendMessage(implode("\n", [
            'BACKUP FAILED',
            'Project: '.($payload['project'] ?? config('smartcafe.project_name')),
            'Server: '.($payload['server'] ?? config('smartcafe.server_name')),
            'Date: '.($payload['date'] ?? now()->toDateString()),
            'Time: '.($payload['time'] ?? now()->format('H:i:s')),
            'Reason: '.($payload['reason'] ?? 'Unknown error'),
        ]));
    }

    private function sendDocumentParts(string $path, string $caption, int $maxBytes): array
    {
        $size = (int) filesize($path);
        $parts = max(1, (int) ceil($size / $maxBytes));
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            return ['ok' => false, 'parts' => 0, 'error' => 'ZIP oxuna bilmədi.'];
        }

        $okAll = true;
        $failed = [];
        $base = preg_replace('/\.zip$/i', '', basename($path)) ?: 'backup';

        try {
            for ($i = 1; $i <= $parts; $i++) {
                $chunk = sys_get_temp_dir().DIRECTORY_SEPARATOR.$base.'.part'.sprintf('%02d', $i).'of'.sprintf('%02d', $parts).'.zip';
                $out = fopen($chunk, 'wb');
                if ($out === false) {
                    $okAll = false;
                    $failed[] = $i;
                    continue;
                }

                $remaining = $maxBytes;
                while ($remaining > 0 && !feof($handle)) {
                    $buf = fread($handle, min(1024 * 1024, $remaining));
                    if ($buf === false || $buf === '') {
                        break;
                    }
                    fwrite($out, $buf);
                    $remaining -= strlen($buf);
                }
                fclose($out);

                $partCaption = $caption."\nHissə {$i}/{$parts}";
                $ok = $this->sendDocument($chunk, $partCaption);
                @unlink($chunk);
                if (!$ok) {
                    $okAll = false;
                    $failed[] = $i;
                }
            }
        } finally {
            fclose($handle);
        }

        return [
            'ok' => $okAll,
            'parts' => $parts,
            'error' => $okAll ? null : ('ZIP hissələri getmədi: '.implode(', ', $failed)),
        ];
    }

    private function api(string $method): string
    {
        return 'https://api.telegram.org/bot'.$this->botToken().'/'.$method;
    }
}
