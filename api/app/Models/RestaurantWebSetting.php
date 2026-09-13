<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantWebSetting extends Model
{
    protected $fillable = [
        'restaurant_id',
        'slug',
        'custom_domain',
        'domain_status',
        'is_active',
        'accept_orders',
        'web_title',
        'web_subtitle',
        'theme_color',
        'bg_color',
        'theme_template',
        'banner_path',
        'instagram_url',
        'whatsapp',
        'website_url',
        'location_url',
        'tiktok_url',
        'domain_note',
        'min_order_amount',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'accept_orders' => 'boolean',
        'min_order_amount' => 'decimal:2',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
