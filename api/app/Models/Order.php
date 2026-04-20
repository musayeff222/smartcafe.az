<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'status',
        'restaurant_id',
        'user_id',
    ];

    // Order belongs to a restaurant
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    // An order can have many stocks
    public function stocks()
    {
        return $this->belongsToMany(Stock::class, 'order_stock')
            ->withPivot(['id', 'quantity', 'detail_id']) 
            ->withTimestamps();
    }

    public function stockSets()
    {
        return $this->belongsToMany(StockSet::class, 'order_stock_sets')
            ->withPivot('price', 'quantity')
            ->withTimestamps();
    }





    public function tableOrders()
    {
        return $this->hasOne(TableOrder::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function quickOrder()
    {
        return $this->hasOne(QuickOrder::class);
    }

    public function prepayments()
    {
        return $this->hasMany(OrderPrepayment::class);
    }

    public function totalPrepayments()
    {
        return $this->prepayments()->sum('amount');
    }

    public function totalAmount()
    {
        return DB::table('order_stock')
            ->join('stocks', 'order_stock.stock_id', '=', 'stocks.id')
            ->where('order_stock.order_id', $this->id)  // Assuming this method is in an Order model
            ->sum(DB::raw('stocks.price * order_stock.quantity'));
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function totalPayments()
    {
        return $this->payments()->sum('amount');
    }

    public function getTotalAmountAfterPaymentsAttribute()
    {
        return $this->totalAmount() - $this->totalPayments();
    }

}
