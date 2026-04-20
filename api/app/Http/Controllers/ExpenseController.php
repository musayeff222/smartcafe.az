<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;


class ExpenseController extends Controller
{
    private int|null $restaurantId;

    public function __construct(Request $request)
    {
        $this->restaurantId = $request->user()?->restaurant_id;
    }

    public function createCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category = ExpenseCategory::create([
            'name' => $validated['name'],
            'restaurant_id' => $this->restaurantId,
            'total_expense' => 0,
        ]);

        return response()->json([
            'message' => 'Expense category created successfully.',
            'data' => $category
        ], 201);
    }

    public function listCategories(): JsonResponse
    {
        $categories = ExpenseCategory::where('restaurant_id', $this->restaurantId)
            ->select('id', 'name', 'total_expense')
            ->get();

        return response()->json($categories);
    }

    public function addExpense(Request $request, ExpenseCategory $category): JsonResponse
    {
        if ($category->restaurant_id !== $this->restaurantId) {
            return response()->json(['message' => 'Unauthorized access to this category.'], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'nullable|string|max:255',
        ]);

        $expense = $category->expenses()->create([
            'amount' => $validated['amount'],
            'reason' => $validated['reason'] ?? null,
        ]);

        // Update total_expense
        $category->increment('total_expense', $validated['amount']);

        return response()->json([
            'message' => 'Expense added successfully.',
            'data' => $expense
        ], 201);
    }

    public function listExpenses(ExpenseCategory $category): JsonResponse
    {
        if ($category->restaurant_id !== $this->restaurantId) {
            return response()->json(['message' => 'Unauthorized access to this category.'], 403);
        }

        return response()->json([
            'category' => $category->name,
            'total_expense' => $category->total_expense,
            'expenses' => $category->expenses()->latest()->get()
        ]);
    }

    public function deleteCategory(ExpenseCategory $category): JsonResponse
    {
        if ($category->restaurant_id !== $this->restaurantId) {
            return response()->json(['message' => 'Unauthorized access to this category.'], 403);
        }

        $category->delete();

        return response()->json(['message' => 'Expense category deleted successfully.']);
    }
}

