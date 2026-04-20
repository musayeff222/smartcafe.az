<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockSetItem extends Model
{
    protected $table = 'stock_set_items';

    protected $fillable = [
        'stock_set_id',
        'stock_id',
        'quantity',
    ];

    public function stock()
    {
        return $this->belongsTo(Stock::class);
    }

    public function stockSet()
    {
        return $this->belongsTo(StockSet::class);
    }
}
