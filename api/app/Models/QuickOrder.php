<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuickOrder extends Model
{
    use HasFactory;

    protected $fillable = ['restaurant_id', 'order_id', 'name', 'phone', 'address', 'note', 'courier_id'];

    // Relationship with Order
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // Relationship with Restaurant
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    // Relationship with Courier
    public function courier()
    {
        return $this->belongsTo(Courier::class);
    }
}
