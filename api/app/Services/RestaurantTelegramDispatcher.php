<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\RestaurantTelegramSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RestaurantTelegramDispatcher
{
    public function notify(int $restaurantId, string $channel, array $payload = []): void
    {
        $run = function () use ($restaurantId, $channel, $payload) {
            try {
                app(self::class)->deliver($restaurantId, $channel, $payload);
            } catch (\Throwable $e) {
                Log::error('Restaurant telegram deliver failed', [
                    'restaurant_id' => $restaurantId,
                    'channel' => $channel,
                    'error' => $e->getMessage(),
                ]);
            }
        };

        try {
            if (app()->runningInConsole()) {
                $run();
                return;
            }
            dispatch($run)->afterResponse();
        } catch (\Throwable $e) {
            $run();
        }
    }

    public function deliver(int $restaurantId, string $channel, array $payload = []): bool
    {
        $restaurant = Restaurant::query()->with('package')->find($restaurantId);
        if (!$restaurant || !$restaurant->hasTelegramBotFeature()) {
            return false;
        }

        $settings = RestaurantTelegramSetting::query()
            ->where('restaurant_id', $restaurantId)
            ->first();

        if (!$settings || !$settings->ready() || !$settings->wants($channel)) {
            return false;
        }

        $text = $this->format($channel, $payload, $restaurant);
        if ($text === '') {
            return false;
        }

        $ok = $this->sendMessage($settings, $text);
        $this->touch($settings, $ok, $ok ? null : 'Telegram mesajı göndərilmədi');

        if ($ok && !empty($payload['actor']) && $settings->wants('staff_ops') && $channel !== 'staff_ops') {
            $staff = $this->formatStaff($payload);
            if ($staff !== '') {
                $this->sendMessage($settings, $staff);
            }
        }

        if ($ok && in_array($channel, ['payments', 'refunds', 'discounts'], true)
            && $settings->wants('cashier_ops') && $channel !== 'cashier_ops') {
            $cashier = $this->formatCashier($channel, $payload);
            if ($cashier !== '') {
                $this->sendMessage($settings, $cashier);
            }
        }

        return $ok;
    }

    public function test(RestaurantTelegramSetting $settings, string $restaurantName): bool
    {
        $text = implode("\n", [
            'SMARTCAFE TEST',
            'Restoran: '.$restaurantName,
            'Vaxt: '.now()->format('d.m.Y H:i'),
            'Telegram bot qoşuldu.',
        ]);

        $ok = $this->sendMessage($settings, $text);
        $this->touch($settings, $ok, $ok ? null : 'Test mesajı getmədi. Token, Chat ID və botu chat-ə əlavə etməyi yoxlayın.');
        return $ok;
    }

    public function sendRaw(RestaurantTelegramSetting $settings, string $text): bool
    {
        $ok = $this->sendMessage($settings, $text);
        $this->touch($settings, $ok, $ok ? null : 'Telegram mesajı göndərilmədi');
        return $ok;
    }

    private function sendMessage(RestaurantTelegramSetting $settings, string $text): bool
    {
        $token = $settings->decryptedToken();
        $chatId = trim((string) $settings->chat_id);
        if ($token === '' || $chatId === '') {
            return false;
        }

        try {
            $response = Http::timeout(12)->post('https://api.telegram.org/bot'.$token.'/sendMessage', [
                'chat_id' => $chatId,
                'text' => mb_substr($text, 0, 3900),
                'disable_web_page_preview' => true,
            ]);

            if (!$response->successful()) {
                Log::warning('Restaurant telegram API error', [
                    'restaurant_id' => $settings->restaurant_id,
                    'status' => $response->status(),
                    'body' => mb_substr($response->body(), 0, 500),
                ]);
                $this->touch($settings, false, $this->apiError($response->body()));
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('Restaurant telegram exception', [
                'restaurant_id' => $settings->restaurant_id,
                'error' => $e->getMessage(),
            ]);
            $this->touch($settings, false, $e->getMessage());
            return false;
        }
    }

    private function apiError(string $body): string
    {
        $json = json_decode($body, true);
        $desc = is_array($json) ? (string) ($json['description'] ?? '') : '';
        return $desc !== '' ? $desc : 'Telegram API xətası';
    }

    private function touch(RestaurantTelegramSetting $settings, bool $ok, ?string $error): void
    {
        try {
            if ($ok) {
                $settings->forceFill([
                    'last_ok_at' => now(),
                    'last_error' => null,
                    'last_error_at' => null,
                ])->save();
            } else {
                $settings->forceFill([
                    'last_error' => mb_substr((string) $error, 0, 500),
                    'last_error_at' => now(),
                ])->save();
            }
        } catch (\Throwable $e) {
        }
    }

    private function format(string $channel, array $p, Restaurant $restaurant): string
    {
        $table = $this->tableLabel($p);
        $lines = $this->itemLines($p);
        $when = now()->format('d.m.Y')."\nSaat: ".now()->format('H:i');

        return match ($channel) {
            'order_new' => $this->block($table ?: 'Yeni sifariş', array_merge(
                ['Yeni sifariş əlavə edildi'],
                $lines,
                $this->actorLine($p)
            )),
            'order_changed' => $this->block(
                ($table ? $table.' – ' : '').($p['title'] ?? 'Sifariş dəyişdirildi'),
                array_merge($lines, $this->actorLine($p))
            ),
            'order_item_removed' => $this->block(
                ($table ? $table.' – ' : '').'Sifariş dəyişdirildi',
                array_merge($lines ?: [($p['product'] ?? 'Məhsul').' silindi'], $this->actorLine($p))
            ),
            'table_open_close' => $this->block(
                $p['title'] ?? ($table ?: 'Masa'),
                array_merge($lines, $this->actorLine($p), [$when])
            ),
            'payments' => $this->block('ÖDƏNİŞ QƏBUL EDİLDİ', array_filter([
                $table ? 'Masa: '.$this->plainTable($p) : null,
                isset($p['amount']) ? 'Məbləğ: '.$this->money($p['amount']) : null,
                !empty($p['payment_type']) ? 'Ödəniş növü: '.$p['payment_type'] : null,
                isset($p['discount']) && (float) $p['discount'] > 0 ? 'Endirim: '.$this->money($p['discount']) : null,
                isset($p['total']) ? 'Yekun: '.$this->money($p['total']) : null,
                $when,
            ])),
            'refunds' => $this->block('ÖDƏNİŞ GERİ QAYTARILDI', array_filter([
                $table ? 'Masa: '.$this->plainTable($p) : null,
                isset($p['amount']) ? 'Məbləğ: '.$this->money($p['amount']) : null,
                $when,
            ])),
            'stock_in' => $this->block('ANBAR GİRİŞİ', array_merge($lines, $this->actorLine($p))),
            'stock_out' => $this->block('ANBAR ÇIXIŞI', array_merge($lines, $this->actorLine($p))),
            'stock_critical' => $this->block('⚠️ ANBAR XƏBƏRDARLIĞI', [
                'Məhsul: '.($p['product'] ?? '-'),
                'Qalıq: '.($p['stock'] ?? '-').' ədəd',
                'Minimum stok: '.($p['min'] ?? '-').' ədəd',
                'Status: Kritik stok',
            ]),
            'stock_empty' => $this->block('⚠️ ANBAR XƏBƏRDARLIĞI', [
                'Məhsul: '.($p['product'] ?? '-'),
                'Qalıq: 0 ədəd',
                'Status: Stokda bitdi',
            ]),
            'staff_ops' => $this->formatStaff($p),
            'cashier_ops' => $this->formatCashier('cashier_ops', $p),
            'discounts' => $this->block('ENDİRİM', array_filter([
                $table ? 'Masa: '.$this->plainTable($p) : null,
                isset($p['discount']) ? 'Endirim: '.$this->money($p['discount']) : null,
                isset($p['total']) ? 'Yekun: '.$this->money($p['total']) : null,
                $when,
            ])),
            'daily_report' => $this->block('📊 GÜNLÜK RESTORAN HESABATI', [
                'Restoran: '.$restaurant->name,
                'Tarix: '.($p['date'] ?? now()->format('d.m.Y')),
                'Ümumi satış: '.$this->money($p['total'] ?? 0),
                'Nağd: '.$this->money($p['cash'] ?? 0),
                'Kart: '.$this->money($p['card'] ?? 0),
                'Sifariş sayı: '.($p['orders'] ?? 0),
                'Bağlanan masalar: '.($p['closed_tables'] ?? 0),
                'Ləğv edilən sifarişlər: '.($p['canceled'] ?? 0),
                'Günlük xərc: '.$this->money($p['expenses'] ?? 0),
            ]),
            default => $this->block($p['title'] ?? 'Bildiriş', array_merge($lines, $this->actorLine($p))),
        };
    }

    private function formatStaff(array $p): string
    {
        if (empty($p['actor'])) {
            return '';
        }
        return $this->block('İşçi əməliyyatı', array_filter([
            'İşçi: '.$p['actor'],
            'Əməliyyat: '.($p['action'] ?? $p['title'] ?? '-'),
            !empty($p['product']) ? 'Məhsul: '.$p['product'].(isset($p['qty']) ? ' ×'.$p['qty'] : '') : null,
            !empty($p['table']) ? 'Masa: '.$this->plainTable($p) : null,
            'Saat: '.now()->format('H:i'),
        ]));
    }

    private function formatCashier(string $channel, array $p): string
    {
        return $this->block('Kassir əməliyyatı', array_filter([
            !empty($p['actor']) ? 'Kassir: '.$p['actor'] : null,
            'Əməliyyat: '.($p['title'] ?? ($channel === 'refunds' ? 'Geri qaytarma' : 'Ödəniş')),
            isset($p['amount']) ? 'Məbləğ: '.$this->money($p['amount']) : null,
            'Saat: '.now()->format('H:i'),
        ]));
    }

    private function block(string $title, array $lines): string
    {
        $body = array_values(array_filter($lines, fn ($l) => $l !== null && $l !== ''));
        return $title.(empty($body) ? '' : "\n".implode("\n", $body));
    }

    private function itemLines(array $p): array
    {
        if (!empty($p['lines']) && is_array($p['lines'])) {
            return array_values(array_filter($p['lines']));
        }
        if (!empty($p['product'])) {
            $q = isset($p['qty']) ? ' ×'.$p['qty'] : '';
            return [$p['product'].$q];
        }
        return [];
    }

    private function actorLine(array $p): array
    {
        return !empty($p['actor']) ? ['İşçi: '.$p['actor']] : [];
    }

    private function tableLabel(array $p): string
    {
        $name = $this->plainTable($p);
        if ($name === '') {
            return '';
        }
        return str_starts_with(mb_strtolower($name), 'masa') ? $name : 'Masa '.$name;
    }

    private function plainTable(array $p): string
    {
        return trim((string) ($p['table'] ?? ''));
    }

    private function money($n): string
    {
        return number_format((float) $n, 2, '.', ' ').' AZN';
    }
}
