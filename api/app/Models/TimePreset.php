<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimePreset extends Model
{
    use HasFactory;

    protected $fillable = ['restaurant_id','name','minutes','price','is_active','table_id'];


    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    public function scopeForTable($q, int $tableId)
    {
        return $q->where('is_active', 1)
            ->where(function ($qq) use ($tableId) {
                $qq->whereNull('table_id')
                    ->orWhere('table_id', $tableId);
            });
    }
}
