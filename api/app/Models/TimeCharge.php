<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeCharge extends Model
{
    protected $fillable = [
        'table_time_session_id',
        'order_id',
        'title',
        'amount',
    ];

    // Əlaqələr
    public function session()
    {
        return $this->belongsTo(TableTimeSession::class, 'table_time_session_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
