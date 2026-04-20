<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Courier extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'name',
        'phone',
        'address',
    ];

    // Relationship with Restaurant
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    // Relationship with QuickOrder
    public function quickOrders()
    {
        return $this->hasMany(QuickOrder::class);
    }
}

