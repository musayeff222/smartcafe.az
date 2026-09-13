<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminRestaurantNote extends Model
{
    protected $fillable = [
        'restaurant_id',
        'user_id',
        'note',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
