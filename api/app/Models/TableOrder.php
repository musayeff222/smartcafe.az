<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TableOrder extends Model
{
    use HasFactory;

    protected $fillable = ['table_id', 'restaurant_id', 'order_id'];

    // A table order belongs to a table
    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    // A table order belongs to an order
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // A table order belongs to a restaurant
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

}

