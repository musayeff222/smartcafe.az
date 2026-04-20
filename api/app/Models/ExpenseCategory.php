<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExpenseCategory extends Model
{
    protected $fillable = ['name', 'restaurant_id', 'total_expense'];

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
}

