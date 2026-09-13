<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class RestaurantTelegramSetting extends Model
{
    public const CHANNELS = [
        'order_new' => 'Yeni sifariş',
        'order_changed' => 'Sifariş dəyişiklikləri',
        'order_item_removed' => 'Məhsul silinməsi',
        'table_open_close' => 'Masa açılması/bağlanması',
        'payments' => 'Ödənişlər',
        'refunds' => 'Geri qaytarmalar',
        'stock_in' => 'Anbar girişləri',
        'stock_out' => 'Anbar çıxışları',
        'stock_critical' => 'Kritik stok',
        'stock_empty' => 'Stok bitməsi',
        'staff_ops' => 'İşçi əməliyyatları',
        'cashier_ops' => 'Kassir əməliyyatları',
        'discounts' => 'Endirimlər',
        'daily_report' => 'Günlük satış hesabatı',
    ];

    protected $fillable = [
        'restaurant_id',
        'bot_token',
        'chat_id',
        'is_enabled',
        'notify_events',
        'daily_report_enabled',
        'daily_report_time',
        'last_daily_report_on',
        'last_ok_at',
        'last_error_at',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'daily_report_enabled' => 'boolean',
            'notify_events' => 'array',
            'last_ok_at' => 'datetime',
            'last_error_at' => 'datetime',
            'last_daily_report_on' => 'date',
        ];
    }

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public static function defaultEvents(): array
    {
        $out = [];
        foreach (array_keys(self::CHANNELS) as $key) {
            $out[$key] = in_array($key, [
                'order_new',
                'order_changed',
                'order_item_removed',
                'table_open_close',
                'payments',
                'stock_critical',
                'stock_empty',
            ], true);
        }
        return $out;
    }

    public function mergedEvents(): array
    {
        return array_merge(self::defaultEvents(), is_array($this->notify_events) ? $this->notify_events : []);
    }

    public function wants(string $channel): bool
    {
        $events = $this->mergedEvents();
        return !empty($events[$channel]);
    }

    public function setEncryptedToken(?string $plain): void
    {
        $plain = trim((string) $plain);
        $this->bot_token = $plain === '' ? $this->bot_token : Crypt::encryptString($plain);
    }

    public function decryptedToken(): string
    {
        if (!$this->bot_token) {
            return '';
        }
        try {
            return Crypt::decryptString($this->bot_token);
        } catch (\Throwable $e) {
            return '';
        }
    }

    public function tokenConfigured(): bool
    {
        return $this->decryptedToken() !== '';
    }

    public function ready(): bool
    {
        return $this->is_enabled
            && $this->tokenConfigured()
            && trim((string) $this->chat_id) !== '';
    }
}
