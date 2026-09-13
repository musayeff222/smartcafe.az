<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminNotificationTarget extends Model
{
    protected $fillable = [
        'notification_id',
        'restaurant_id',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function notification()
    {
        return $this->belongsTo(AdminNotification::class, 'notification_id');
    }

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }
}
