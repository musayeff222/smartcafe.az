<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpenseSetting extends Model
{
    protected $fillable = [
        'restaurant_id',
        'daily_limit',
        'anomaly_threshold',
        'notify_unpaid',
    ];

    protected $casts = [
        'daily_limit' => 'decimal:2',
        'anomaly_threshold' => 'decimal:2',
        'notify_unpaid' => 'boolean',
    ];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }
}
