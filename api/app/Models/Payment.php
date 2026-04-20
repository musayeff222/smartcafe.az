<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'user_id',  // Add user_id
        'order_name',  // Add order_name
        'amount',
        'type',
        'date',
        'customer_id',  // Add this field
        'restaurant_id',
        'open_date',   // Add open_date
        'close_date', 
        'items',  // Add items
    ];

    protected $casts = [
        'items' => 'array',
    ];
    
    
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

