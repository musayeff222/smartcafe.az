<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsitePackage extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'old_price',
        'discount_percent',
        'badge',
        'color',
        'cta_text',
        'cta_url',
        'features',
        'limits',
        'monthly_price',
        'yearly_price',
        'duration_days',
        'trial_days',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'old_price' => 'float',
            'monthly_price' => 'float',
            'yearly_price' => 'float',
            'features' => 'array',
            'limits' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
