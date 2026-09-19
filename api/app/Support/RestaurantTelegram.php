<?php

namespace App\Support;

use App\Services\RestaurantTelegramDispatcher;

class RestaurantTelegram
{
    public static function notify(int $restaurantId, string $channel, array $payload = []): void
    {
        app(RestaurantTelegramDispatcher::class)->notify($restaurantId, $channel, $payload);
    }

    public static function billPrinted(int $restaurantId, string $tableName, ?string $actor = null): void
    {
        self::notify($restaurantId, 'table_open_close', [
            'title' => 'Hesab çap olundu',
            'table' => $tableName,
            'actor' => $actor,
        ]);
    }
}
