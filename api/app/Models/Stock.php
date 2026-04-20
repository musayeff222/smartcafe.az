<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'stock_group_id',
        'name',
        'image',
        'show_on_qr',
        'price',
        'amount',
        'critical_amount',
        'alert_critical',
        'order_start',
        'order_stop',
        'description'
    ];

    // Relationship with StockGroup
    public function stockGroup()
    {
        return $this->belongsTo(StockGroup::class)->withDefault(); // withDefault ensures it returns null when not set
    }

    // Relationship with Restaurant
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }
    public function orders()
    {
        return $this->belongsToMany(Order::class, 'order_stock')
            ->withPivot(['id', 'quantity', 'detail_id']) 
            ->withTimestamps();
    }
    
    public function rawMaterials()
    {
        return $this->belongsToMany(RawMaterial::class)
                    ->withPivot('quantity')
                    ->withTimestamps();
    }
    
    public function details()
    {
        return $this->hasMany(StockDetail::class);
    }

    // Əgər bu stock bir qrupdursa, daxilindəki stock-lar:
    public function childStocks()
    {
        return $this->belongsToMany(Stock::class, 'grouped_stocks', 'group_id', 'child_stock_id')
                    ->withPivot('quantity');
    }
    
    // Əgər bu stock hansısa qrup stock-un tərkibindədirsə:
    public function parentGroups()
    {
        return $this->belongsToMany(Stock::class, 'grouped_stocks', 'child_stock_id', 'group_id')
                    ->withPivot('quantity');
    }
    
    public function stockSets()
    {
        return $this->belongsToMany(StockSet::class, 'stock_set_items')
                    ->withPivot('quantity')
                    ->withTimestamps();
    }


}


