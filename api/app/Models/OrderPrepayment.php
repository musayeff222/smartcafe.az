<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderPrepayment extends Model
{
    protected $fillable = [
        'order_id',
        'amount',
        'type',  // Add type to fillable attributes
        'date',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}

