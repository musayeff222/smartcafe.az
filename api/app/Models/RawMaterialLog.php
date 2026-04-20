<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RawMaterialLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'raw_material_id',
        'type',         // 'in' or 'out'
        'quantity',
        'reason',
    ];

    public function rawMaterial()
    {
        return $this->belongsTo(RawMaterial::class);
    }
}
