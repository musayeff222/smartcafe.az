<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TableGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'name',
    ];

    // Relationship with Restaurant
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    // Relationship with Tables
    public function tables()
    {
        return $this->hasMany(Table::class);
    }
}

