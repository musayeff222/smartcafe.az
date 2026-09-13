<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsiteSetting extends Model
{
    protected $fillable = ['group', 'key', 'value'];

    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    public static function scalar(string $key, $default = null)
    {
        $row = static::query()->where('key', $key)->first();
        if (!$row) {
            return $default;
        }
        $value = $row->value;
        if (is_array($value)) {
            return $value['id'] ?? $value['chat_id'] ?? reset($value) ?: $default;
        }
        return $value === null || $value === '' ? $default : $value;
    }

    public static function grouped(): array
    {
        $out = [];
        foreach (static::query()->orderBy('group')->orderBy('key')->get() as $row) {
            $out[$row->group][$row->key] = $row->value;
        }
        return $out;
    }

    public static function putGroup(string $group, array $values): void
    {
        foreach ($values as $key => $value) {
            static::updateOrCreate(
                ['key' => $group.'.'.$key],
                ['group' => $group, 'value' => $value]
            );
        }
    }
}
