<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockSet extends Model
{
    protected $fillable = ['name', 'price','restaurant_id','image'];

// StockSet.php
    public function stocks()
    {
        return $this->belongsToMany(Stock::class, 'stock_set_items')
            ->withPivot(['quantity', 'price']);
    }


    public function calculatePrice()
    {
        return $this->stocks->sum(function ($stock) {
            return $stock->pivot->price * $stock->pivot->quantity;
        });
    }


    public function orders()
    {
        return $this->belongsToMany(Order::class, 'order_stock_sets')
            ->withPivot('price', 'quantity')
            ->withTimestamps();
    }

    public function stockSetItems()
    {
        return $this->hasMany(StockSetItem::class);
    }


    public function getImageUrlAttribute()
    {
        return $this->image ? asset('storage/' . $this->image) : null;
    }

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }



}
