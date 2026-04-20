<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerTransaction extends Model
{
    protected $fillable = [
        'customer_id',
        'amount',
        'type',
        'note',
        'date', // Add this line

    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    
}
