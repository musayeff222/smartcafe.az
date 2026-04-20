<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class RawMaterial extends Model
{
    protected $fillable = [
        'stock_id',
        'name',
        'restaurant_id',
        'unit',
        'quantity',
    ];

    public function stocks()
    {
        return $this->belongsToMany(Stock::class)
                    ->withPivot('quantity')
                    ->withTimestamps();
    }
    

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function stock()
    {
        return $this->hasOne(RawMaterialStock::class);
    }

    public function logs()
    {
        return $this->hasMany(RawMaterialLog::class);
    }


}
