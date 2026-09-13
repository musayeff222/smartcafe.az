<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminNotification extends Model
{
    protected $fillable = [
        'title',
        'body',
        'type',
        'priority',
        'link',
        'icon',
        'created_by',
        'is_broadcast',
        'status',
        'failed_count',
    ];

    protected function casts(): array
    {
        return [
            'is_broadcast' => 'boolean',
        ];
    }

    public function targets()
    {
        return $this->hasMany(AdminNotificationTarget::class, 'notification_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
