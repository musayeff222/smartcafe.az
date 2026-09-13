<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\ExpenseSetting;
use App\Services\ExpenseCategoryDefaults;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ExpenseController extends Controller
{
    private function restaurantId(Request $request): ?int
    {
        return $request->user()?->restaurant_id;
    }

    private function denyUnless(Request $request, array $permissions): ?JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if ($user->hasRole('super-admin') || $user->hasRole('admin')) {
            return null;
        }
        if ($user->hasAnyPermission($permissions)) {
            return null;
        }
        return response()->json(['message' => 'Forbidden'], 403);
    }

    private function categoryForRestaurant(int $restaurantId, int $categoryId): ?ExpenseCategory
    {
        return ExpenseCategory::where('restaurant_id', $restaurantId)->find($categoryId);
    }

    private function expenseForRestaurant(int $restaurantId, int $expenseId): ?Expense
    {
        return Expense::with(['category', 'creator'])
            ->where('restaurant_id', $restaurantId)
            ->find($expenseId);
    }

    private function settingsFor(int $restaurantId): ExpenseSetting
    {
        return ExpenseSetting::firstOrCreate(['restaurant_id' => $restaurantId]);
    }

    private function buildAlerts(int $restaurantId, ExpenseSetting $settings): array
    {
        $alerts = [];
        $today = Carbon::today();
        $todayTotal = Expense::forRestaurant($restaurantId)
            ->active()
            ->whereDate('expense_date', $today)
            ->sum('amount');

        if ($settings->daily_limit && $todayTotal > $settings->daily_limit) {
            $alerts[] = [
                'type' => 'daily_limit',
                'message' => 'Günlük xərc limiti aşılıb.',
                'today_total' => (float) $todayTotal,
                'limit' => (float) $settings->daily_limit,
            ];
        }

        if ($settings->anomaly_threshold) {
            $latest = Expense::forRestaurant($restaurantId)->active()->latest('id')->first();
            if ($latest && $latest->amount >= $settings->anomaly_threshold) {
                $alerts[] = [
                    'type' => 'anomaly',
                    'message' => 'Anormal yüksək xərc qeydə alınıb.',
                    'expense_id' => $latest->id,
                    'amount' => (float) $latest->amount,
                    'threshold' => (float) $settings->anomaly_threshold,
                ];
            }
        }

        if ($settings->notify_unpaid) {
            $unpaidCount = Expense::forRestaurant($restaurantId)->where('status', 'pending')->count();
            if ($unpaidCount > 0) {
                $alerts[] = [
                    'type' => 'unpaid',
                    'message' => 'Ödənilməmiş xərclər var.',
                    'count' => $unpaidCount,
                ];
            }
        }

        return $alerts;
    }

    // ——— Categories ———

    public function listCategories(Request $request): JsonResponse
    {
        if ($r = $this->denyUnless($request, ['expenses.view', 'expenses.create'])) {
            return $r;
        }
        $restaurantId = $this->restaurantId($request);
        if (!$restaurantId) {
            return response()->json(['message' => 'No restaurant'], 403);
        }

        ExpenseCategoryDefaults::ensureForRestaurant($restaurantId);

        $categories = ExpenseCategory::where('restaurant_id', $restaurantId)
            ->get(['id', 'name', 'slug', 'total_expense', 'is_system']);

        return response()->json(ExpenseCategoryDefaults::sortCategories($categories));
    }

    public function createCategory(Request $request): JsonResponse
    {
        if ($r = $this->denyUnless($request, ['expenses.manage-categories'])) {
            return $r;
        }
        $restaurantId = $this->restaurantId($request);
        $validated = $request->validate(['name' => 'required|string|max:255']);

        $category = ExpenseCategory::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'restaurant_id' => $restaurantId,
            'total_expense' => 0,
            'is_system' => false,
        ]);

        return response()->json($category, 201);
    }

    public function updateCategory(Request $request, ExpenseCategory $category): JsonResponse
    {
        if ($r = $this->denyUnless($request, ['expenses.manage-categories'])) {
            return $r;
        }
        if ($category->restaurant_id !== $this->restaurantId($request)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $category->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
        ]);
        return response()->json($category);
    }

    public function deleteCategoryAuth(Request $request, ExpenseCategory $category): JsonResponse
    {
        if ($r = $this->denyUnless($request, ['expenses.manage-categories'])) {
            return $r;
        }
        if ($category->restaurant_id !== $this->restaurantId($request)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $category->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ——— Expenses CRUD ———

    public function index(Request $request): JsonResponse
    {
        if ($r = $this->denyUnless($request, ['expenses.view', 'expenses.create'])) {
            return $r;
        }
        $restaurantId = $this->restaurantId($request);
        if (!$restaurantId) {
            return response()->json(['message' => 'No restaurant'], 403);
        }

        $query = Expense::with(['category:id,name', 'creator:id,name'])
            ->forRestaurant($restaurantId);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('note', 'like', "%{$search}%")
                    ->orWhere('reason', 'like', "%{$search}%");
            });
        }
        if ($request->filled('category_id')) {
            $query->where('expense_category_id', $request->query('category_id'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('expense_date', '>=', $request->query('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('expense_date', '<=', $request->query('date_to'));
        }
        if ($request->filled('amount_min')) {
            $query->where('amount', '>=', $request->query('amount_min'));
        }
        if ($request->filled('amount_max')) {
            $query->where('amount', '<=', $request->query('amount_max'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->query('payment_method'));
        }

        $perPage = min((int) $request->query('per_page', 15), 100);
        $paginated = $query->orderByDesc('expense_date')->orderByDesc('id')->paginate($perPage);

        return response()->json($paginated);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        if ($r = $this->denyUnless($request, ['expenses.view'])) {
            return $r;
        }
        $expense = $this->expenseForRestaurant($this->restaurantId($request), $id);
        if (!$expense) {
            return response()->json(['message' => 'Not found'], 404);
        }
        return response()->json($expense);
    }

    public function store(Request $request): JsonResponse
    {
        if ($r = $this->denyUnless($request, ['expenses.create'])) {
            return $r;
        }
        $restaurantId = $this->restaurantId($request);
        $validated = $this->validateExpense($request);

        $category = $this->categoryForRestaurant($restaurantId, (int) $validated['expense_category_id']);
        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store(
                "{$restaurantId}/expense_receipts",
                'public'
            );
        }

        $expense = DB::transaction(function () use ($request, $validated, $restaurantId, $category, $receiptPath) {
            $expense = Expense::create([
                'expense_category_id' => $category->id,
                'restaurant_id' => $restaurantId,
                'name' => $validated['name'],
                'amount' => $validated['amount'],
                'reason' => $validated['note'] ?? null,
                'note' => $validated['note'] ?? null,
                'expense_date' => $validated['expense_date'],
                'payment_method' => $validated['payment_method'],
                'status' => $validated['status'] ?? 'paid',
                'created_by' => $request->user()->id,
                'receipt_path' => $receiptPath,
            ]);
            if ($expense->status !== 'cancelled') {
                $category->increment('total_expense', $validated['amount']);
            }
            return $expense;
        });

        return response()->json(
            $expense->load(['category:id,name', 'creator:id,name']),
            201
        );
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($r = $this->denyUnless($request, ['expenses.update'])) {
            return $r;
        }
        $restaurantId = $this->restaurantId($request);
        $expense = $this->expenseForRestaurant($restaurantId, $id);
        if (!$expense) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $this->validateExpense($request, $expense->id);
        $category = $this->categoryForRestaurant($restaurantId, (int) $validated['expense_category_id']);
        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $oldCategoryId = $expense->expense_category_id;
        $oldAmount = $expense->amount;
        $oldStatus = $expense->status;

        if ($request->hasFile('receipt')) {
            if ($expense->receipt_path) {
                Storage::disk('public')->delete($expense->receipt_path);
            }
            $validated['receipt_path'] = $request->file('receipt')->store(
                "{$restaurantId}/expense_receipts",
                'public'
            );
        }

        DB::transaction(function () use ($expense, $validated, $oldCategoryId, $oldAmount, $oldStatus, $category) {
            $this->adjustCategoryTotals($oldCategoryId, $oldAmount, $oldStatus, 'remove');

            $expense->update([
                'expense_category_id' => $category->id,
                'name' => $validated['name'],
                'amount' => $validated['amount'],
                'reason' => $validated['note'] ?? null,
                'note' => $validated['note'] ?? null,
                'expense_date' => $validated['expense_date'],
                'payment_method' => $validated['payment_method'],
                'status' => $validated['status'] ?? $expense->status,
                'receipt_path' => $validated['receipt_path'] ?? $expense->receipt_path,
            ]);

            $this->adjustCategoryTotals(
                $category->id,
                $validated['amount'],
                $validated['status'] ?? $expense->status,
                'add'
            );
        });

        return response()->json($expense->fresh(['category:id,name', 'creator:id,name']));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($r = $this->denyUnless($request, ['expenses.delete'])) {
            return $r;
        }
        $restaurantId = $this->restaurantId($request);
        $expense = $this->expenseForRestaurant($restaurantId, $id);
        if (!$expense) {
            return response()->json(['message' => 'Not found'], 404);
        }

        DB::transaction(function () use ($expense) {
            $this->adjustCategoryTotals($expense->expense_category_id, $expense->amount, $expense->status, 'remove');
            if ($expense->receipt_path) {
                Storage::disk('public')->delete($expense->receipt_path);
            }
            $expense->delete();
        });

        return response()->json(['message' => 'Deleted']);
    }

    // Legacy category-scoped endpoints
    public function addExpense(Request $request, ExpenseCategory $category): JsonResponse
    {
        $request->merge([
            'expense_category_id' => $category->id,
            'name' => $request->input('name', $request->input('reason', 'Xərc')),
            'expense_date' => $request->input('expense_date', now()->toDateString()),
            'payment_method' => $request->input('payment_method', 'cash'),
            'note' => $request->input('note', $request->input('reason')),
        ]);
        return $this->store($request);
    }

    public function listExpenses(Request $request, ExpenseCategory $category): JsonResponse
    {
        if ($category->restaurant_id !== $this->restaurantId($request)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $request->merge(['category_id' => $category->id]);
        return $this->index($request);
    }

    public function grouped(Request $request): JsonResponse
    {
        if ($r = $this->denyUnless($request, ['expenses.view', 'expenses.create'])) {
            return $r;
        }
        $restaurantId = $this->restaurantId($request);
        if (!$restaurantId) {
            return response()->json(['message' => 'No restaurant'], 403);
        }

        $period = $request->query('period', 'day');
        if (!in_array($period, ['day', 'month'], true)) {
            return response()->json(['message' => 'Invalid period'], 422);
        }

        $year = (int) $request->query('year', now()->year);
        $month = (int) $request->query('month', now()->month);
        $month = max(1, min(12, $month));

        $query = Expense::with(['category:id,name', 'creator:id,name'])
            ->forRestaurant($restaurantId)
            ->active()
            ->orderByDesc('expense_date')
            ->orderByDesc('id');

        if ($period === 'day') {
            $query->whereYear('expense_date', $year)->whereMonth('expense_date', $month);
        } else {
            $query->whereYear('expense_date', $year);
        }

        $expenses = $query->get();
        $grouped = [];

        if ($period === 'day') {
            $daysInMonth = Carbon::create($year, $month, 1)->daysInMonth;
            for ($d = 1; $d <= $daysInMonth; $d++) {
                $key = Carbon::create($year, $month, $d)->format('Y-m-d');
                $grouped[$key] = ['key' => $key, 'total' => 0, 'count' => 0, 'items' => []];
            }
        } else {
            for ($m = 1; $m <= 12; $m++) {
                $key = sprintf('%04d-%02d', $year, $m);
                $grouped[$key] = ['key' => $key, 'total' => 0, 'count' => 0, 'items' => []];
            }
        }

        foreach ($expenses as $expense) {
            $key = $period === 'day'
                ? Carbon::parse($expense->expense_date)->format('Y-m-d')
                : Carbon::parse($expense->expense_date)->format('Y-m');

            if (!isset($grouped[$key])) {
                $grouped[$key] = ['key' => $key, 'total' => 0, 'count' => 0, 'items' => []];
            }

            $grouped[$key]['total'] += (float) $expense->amount;
            $grouped[$key]['count']++;
            $grouped[$key]['items'][] = $expense;
        }

        krsort($grouped);

        return response()->json([
            'period' => $period,
            'year' => $year,
            'month' => $period === 'day' ? $month : null,
            'groups' => array_values($grouped),
            'grand_total' => round($expenses->sum('amount'), 2),
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        if ($r = $this->denyUnless($request, ['expenses.view'])) {
            return $r;
        }
        $restaurantId = $this->restaurantId($request);
        if ($restaurantId) {
            ExpenseCategoryDefaults::ensureForRestaurant($restaurantId);
        }
        $base = Expense::forRestaurant($restaurantId)->active();

        $today = (clone $base)->whereDate('expense_date', Carbon::today())->sum('amount');
        $week = (clone $base)->whereBetween('expense_date', [
            Carbon::now()->startOfWeek(),
            Carbon::now()->endOfWeek(),
        ])->sum('amount');
        $month = (clone $base)->whereMonth('expense_date', Carbon::now()->month)
            ->whereYear('expense_date', Carbon::now()->year)
            ->sum('amount');
        $total = (clone $base)->sum('amount');

        $topCategory = ExpenseCategory::where('restaurant_id', $restaurantId)
            ->orderByDesc('total_expense')
            ->first(['id', 'name', 'total_expense']);

        $dailyChart = (clone $base)
            ->where('expense_date', '>=', Carbon::now()->subDays(13))
            ->selectRaw('DATE(expense_date) as date, SUM(amount) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $monthlyChart = (clone $base)
            ->where('expense_date', '>=', Carbon::now()->subMonths(5)->startOfMonth())
            ->selectRaw('DATE_FORMAT(expense_date, "%Y-%m") as month, SUM(amount) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $categoryPie = DB::table('expenses')
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->where('expenses.restaurant_id', $restaurantId)
            ->where('expenses.status', '!=', 'cancelled')
            ->selectRaw('expense_categories.name as name, SUM(expenses.amount) as total')
            ->groupBy('expense_categories.id', 'expense_categories.name')
            ->orderByDesc('total')
            ->get();

        $settings = $this->settingsFor($restaurantId);

        return response()->json([
            'cards' => [
                'today' => (float) $today,
                'week' => (float) $week,
                'month' => (float) $month,
                'total' => (float) $total,
                'top_category' => $topCategory ? [
                    'name' => $topCategory->name,
                    'total' => (float) $topCategory->total_expense,
                ] : null,
            ],
            'daily_chart' => $dailyChart,
            'monthly_chart' => $monthlyChart,
            'category_pie' => $categoryPie,
            'alerts' => $this->buildAlerts($restaurantId, $settings),
            'settings' => $settings,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        if ($r = $this->denyUnless($request, ['expenses.manage-categories'])) {
            return $r;
        }
        $restaurantId = $this->restaurantId($request);
        $validated = $request->validate([
            'daily_limit' => 'nullable|numeric|min:0',
            'anomaly_threshold' => 'nullable|numeric|min:0',
            'notify_unpaid' => 'boolean',
        ]);
        $settings = $this->settingsFor($restaurantId);
        $settings->update($validated);
        return response()->json($settings);
    }

    public function export(Request $request): JsonResponse
    {
        if ($r = $this->denyUnless($request, ['expenses.export', 'expenses.view'])) {
            return $r;
        }
        $restaurantId = $this->restaurantId($request);
        $query = Expense::with(['category:id,name', 'creator:id,name'])
            ->forRestaurant($restaurantId);

        if ($request->filled('date_from')) {
            $query->whereDate('expense_date', '>=', $request->query('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('expense_date', '<=', $request->query('date_to'));
        }
        if ($request->filled('category_id')) {
            $query->where('expense_category_id', $request->query('category_id'));
        }

        $rows = $query->orderByDesc('expense_date')->get();

        return response()->json([
            'rows' => $rows,
            'exported_at' => now()->toIso8601String(),
        ]);
    }

    private function validateExpense(Request $request, ?int $expenseId = null): array
    {
        return $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'expense_date' => 'required|date',
            'note' => 'nullable|string|max:2000',
            'payment_method' => ['required', Rule::in(Expense::PAYMENT_METHODS)],
            'status' => ['nullable', Rule::in(Expense::STATUSES)],
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);
    }

    private function adjustCategoryTotals(int $categoryId, $amount, string $status, string $action): void
    {
        if ($status === 'cancelled') {
            return;
        }
        $category = ExpenseCategory::find($categoryId);
        if (!$category) {
            return;
        }
        if ($action === 'add') {
            $category->increment('total_expense', $amount);
        } else {
            $category->decrement('total_expense', min($amount, $category->total_expense));
        }
    }
}
