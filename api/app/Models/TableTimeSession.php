<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TableTimeSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'table_id',
        'order_id',
        'status',
        'started_at',
        'paused_at',
        'ended_at',
        'paused_seconds',
        'billing_mode',
        'minute_rate_qepik',
        'time_preset_id',
        'target_minutes',
        'actual_seconds',
        'amount',
    ];

    protected $casts = [
        'started_at'     => 'datetime',
        'paused_at'      => 'datetime',
        'ended_at'       => 'datetime',
        'actual_seconds' => 'integer',
        'paused_seconds' => 'integer',
        'minute_rate_qepik' => 'integer',
        'target_minutes' => 'integer',
    ];

}
