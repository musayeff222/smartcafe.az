<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarketingPlan extends Model
{
    protected $fillable = [
        'name', 'slug', 'tag', 'pitch', 'price_label', 'features',
        'is_featured', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function promoCodes(): HasMany
    {
        return $this->hasMany(MarketingPromoCode::class);
    }
}
