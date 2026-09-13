<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpenseCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'restaurant_id',
        'total_expense',
        'is_system',
    ];

    protected $casts = [
        'total_expense' => 'decimal:2',
        'is_system' => 'boolean',
    ];

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function recalculateTotal(): void
    {
        $total = $this->expenses()
            ->where('status', '!=', 'cancelled')
            ->sum('amount');

        $this->update(['total_expense' => $total]);
    }
}
