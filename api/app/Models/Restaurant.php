<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Restaurant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'logo',
        'language',
        'currency',
        'custom_message',
        'is_qr_active',
        'get_qr_order',
        'main_printer',
        'kitchen_printer',
        'bar_printer',
        'email',
        'address',
        'print_mode',
        'phone',
        'empty_table_color', // Add this line
        'booked_table_color', // Add this line
        'is_active',          // Add this line
        'active_until', 
        'open_time',
        'is_psclub',
        'close_time'
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function stockGroups()
    {
        return $this->hasMany(StockGroup::class);
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }

    public function couriers()
    {
        return $this->hasMany(Courier::class);
    }

    public function tableGroups()
    {
        return $this->hasMany(TableGroup::class);
    }

    public function tables()
    {
        return $this->hasMany(Table::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function tableOrders()
    {
        return $this->hasManyThrough(TableOrder::class, Table::class);
    }

    public function quickOrders()
    {
        return $this->hasMany(QuickOrder::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function securitySettings()
    {
        return $this->hasMany(RestaurantSecuritySetting::class);
    }

}
