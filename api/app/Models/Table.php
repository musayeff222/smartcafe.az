<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'table_group_id',
        'name',
        'unique_url',
        'qr_image',
    ];

    // Relationship with Restaurant
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    // Relationship with TableGroup
    public function tableGroup()
    {
        return $this->belongsTo(TableGroup::class);
    }

    public function tableOrders()
    {
        return $this->hasMany(TableOrder::class);
    }

    public function isAvailable(): bool
    {
        // Check if the table has any active orders that are not completed
        return !$this->tableOrders()
                    ->whereHas('order', function ($query) {
                        $query->whereIn('status', ['approved']);
                    })
                    ->exists();
    }

    // protected $appends = ['is_available', 'book_time'];

    // public function getIsAvailableAttribute(): bool
    // {
    //     return $this->isAvailable();
    // }

    // public function getBookTimeAttribute()
    // {
    //     // Get the most recent created_at time for tableOrders with an 'approved' order
    //     $order = $this->tableOrders()
    //         ->whereHas('order', function ($query) {
    //             $query->where('status', 'approved');
    //         })
    //         ->orderBy('created_at', 'desc')
    //         ->first();

    //     return $order ? $order->created_at : null; // Return null if no approved order found
    // }
}
