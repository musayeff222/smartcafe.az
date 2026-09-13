<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketingPromoCode extends Model
{
    protected $fillable = [
        'code', 'title', 'description', 'discount_type', 'discount_value',
        'max_uses', 'uses_count', 'valid_from', 'valid_until',
        'marketing_plan_id', 'show_on_landing', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'valid_from' => 'datetime',
            'valid_until' => 'datetime',
            'show_on_landing' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(MarketingPlan::class, 'marketing_plan_id');
    }
}
