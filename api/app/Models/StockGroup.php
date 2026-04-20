<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'name',
        'image',
        'color',
        'kitchen_printer_active',
        'bar_printer_active',
        'show_on_qr_menu',
    ];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }
}
