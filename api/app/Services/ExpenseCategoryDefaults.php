<?php

namespace App\Services;

use App\Models\ExpenseCategory;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ExpenseCategoryDefaults
{
    public const CATEGORIES = [
        'Məhsul alışları',
        'Maaş',
        'Kommunal',
        'İcarə',
        'Vergi',
        'Təmir',
        'Reklam',
        'Kuryer',
        'Mətbəx xərcləri',
        'Digər',
    ];

    /** Standart kateqoriyaları əlavə et (çatışmayanlar). */
    public static function ensureForRestaurant(int $restaurantId): void
    {
        $existingNames = ExpenseCategory::where('restaurant_id', $restaurantId)
            ->pluck('name')
            ->map(fn (string $name) => self::normalizeName($name))
            ->flip();

        foreach (self::CATEGORIES as $name) {
            if ($existingNames->has(self::normalizeName($name))) {
                continue;
            }

            ExpenseCategory::create([
                'name' => $name,
                'slug' => Str::slug($name) ?: 'kateqoriya-' . uniqid(),
                'restaurant_id' => $restaurantId,
                'total_expense' => 0,
                'is_system' => true,
            ]);
        }
    }

    public static function normalizeName(string $name): string
    {
        return mb_strtolower(trim($name));
    }

    /** Siyahını standart sıra ilə düzür. */
    public static function sortCategories(Collection $categories): Collection
    {
        $order = array_flip(self::CATEGORIES);

        return $categories
            ->sortBy(fn (ExpenseCategory $cat) => $order[$cat->name] ?? 1000)
            ->values();
    }
}
