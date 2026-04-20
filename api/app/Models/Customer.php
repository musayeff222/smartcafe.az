<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'money',
        'restaurant_id',
        'address',
        'note',

    ];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function customer_transactions()
    {
        return $this->hasMany(CustomerTransaction::class);
    }
}

