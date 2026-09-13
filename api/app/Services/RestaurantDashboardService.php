<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Order;
use App\Models\Payment;
use App\Models\QuickOrder;
use App\Models\Restaurant;
use App\Models\Stock;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class RestaurantDashboardService
{
    public function getDashboard(Restaurant $restaurant, array $params): array
    {
        $filter = $params['filter'] ?? 'today';
        $customFrom = $params['from'] ?? null;
        $customTo = $params['to'] ?? null;

        $cacheKey = sprintf(
            'restaurant_dashboard:%s:%s:%s:%s',
            $restaurant->id,
            $filter,
            $customFrom ?? '',
            $customTo ?? ''
        );

        return Cache::remember($cacheKey, 45, function () use ($restaurant, $filter, $customFrom, $customTo) {
            return $this->buildDashboard($restaurant, $filter, $customFrom, $customTo);
        });
    }

    private function buildDashboard(Restaurant $restaurant, string $filter, ?string $customFrom, ?string $customTo): array
    {
        $rid = (string) $restaurant->id;
        $now = Carbon::now();

        [$rangeStart, $rangeEnd] = $this->resolveRange($filter, $customFrom, $customTo);
        [$prevStart, $prevEnd] = $this->previousRange($rangeStart, $rangeEnd, $filter);

        $salesInRange = $this->sumPayments($rid, $rangeStart, $rangeEnd);
        $salesPrev = $this->sumPayments($rid, $prevStart, $prevEnd);

        $todayStart = $now->copy()->startOfDay();
        $todayEnd = $now->copy()->endOfDay();
        $yesterdayStart = $now->copy()->subDay()->startOfDay();
        $yesterdayEnd = $now->copy()->subDay()->endOfDay();

        $dailySales = $this->sumPayments($rid, $todayStart, $todayEnd);
        $dailySalesPrev = $this->sumPayments($rid, $yesterdayStart, $yesterdayEnd);

        $weekStart = $now->copy()->startOfWeek();
        $weekEnd = $now->copy()->endOfWeek();
        $prevWeekStart = $weekStart->copy()->subWeek();
        $prevWeekEnd = $weekEnd->copy()->subWeek();

        $weeklySales = $this->sumPayments($rid, $weekStart, $weekEnd);
        $weeklySalesPrev = $this->sumPayments($rid, $prevWeekStart, $prevWeekEnd);

        $monthStart = $now->copy()->startOfMonth();
        $monthEnd = $now->copy()->endOfMonth();
        $prevMonthStart = $monthStart->copy()->subMonth();
        $prevMonthEnd = $monthEnd->copy()->subMonth();

        $monthlySales = $this->sumPayments($rid, $monthStart, $monthEnd);
        $monthlySalesPrev = $this->sumPayments($rid, $prevMonthStart, $prevMonthEnd);

        $dailyExpense = $this->sumExpenses($rid, $todayStart, $todayEnd);
        $dailyExpensePrev = $this->sumExpenses($rid, $yesterdayStart, $yesterdayEnd);
        $monthlyExpense = $this->sumExpenses($rid, $monthStart, $monthEnd);

        $dailyProfit = $dailySales - $dailyExpense;
        $dailyProfitPrev = $dailySalesPrev - $dailyExpensePrev;

        $tablesLive = $this->liveTables($rid);
        $orderCounts = $this->orderCounts($rid, $todayStart, $todayEnd);

        $sparkDaily = $this->dailySalesSeries($rid, 7);
        $sparkWeekly = $this->weeklySalesSeries($rid, 6);

        return [
            'generated_at' => $now->toIso8601String(),
            'filter' => $filter,
            'range' => [
                'from' => $rangeStart->toDateString(),
                'to' => $rangeEnd->toDateString(),
            ],
            'multi_branch' => [
                'enabled' => false,
                'message' => 'Filial modulu aktiv deyil — tək restoran statistikası göstərilir.',
            ],
            'cards' => [
                'daily_sales' => $this->card($dailySales, $dailySalesPrev, $sparkDaily),
                'weekly_sales' => $this->card($weeklySales, $weeklySalesPrev, $sparkWeekly),
                'monthly_sales' => $this->card($monthlySales, $monthlySalesPrev, $this->monthlySparkline($rid, 6)),
                'today_orders' => $this->card(
                    (float) $orderCounts['today'],
                    (float) $orderCounts['yesterday'],
                    $orderCounts['spark']
                ),
                'active_tables' => ['value' => $tablesLive['active'], 'trend' => null, 'sparkline' => []],
                'empty_tables' => ['value' => $tablesLive['empty'], 'trend' => null, 'sparkline' => []],
                'kitchen_pending' => ['value' => $orderCounts['kitchen_pending'], 'trend' => null, 'sparkline' => []],
                'daily_profit' => $this->card($dailyProfit, $dailyProfitPrev, $sparkDaily),
                'daily_expense' => $this->card($dailyExpense, $dailyExpensePrev, []),
                'net_profit' => $this->card($dailyProfit, $dailyProfitPrev, $sparkDaily),
                'monthly_revenue' => $this->card($monthlySales, $monthlySalesPrev, $this->monthlySparkline($rid, 6)),
                'total_customers' => [
                    'value' => (float) Customer::where('restaurant_id', $rid)->count(),
                    'trend' => $this->trend(
                        (float) Customer::where('restaurant_id', $rid)
                            ->where('created_at', '>=', $monthStart)->count(),
                        (float) Customer::where('restaurant_id', $rid)
                            ->whereBetween('created_at', [$prevMonthStart, $prevMonthEnd])->count()
                    ),
                    'sparkline' => [],
                ],
                'range_sales' => $this->card($salesInRange, $salesPrev, []),
            ],
            'charts' => [
                'daily_sales' => $this->dailySalesSeries($rid, 14),
                'weekly_comparison' => $this->weeklySalesSeries($rid, 8),
                'monthly_revenue' => $this->monthlyRevenueSeries($rid, 12),
                'hourly_orders' => $this->hourlyOrders($rid, $rangeStart, $rangeEnd),
                'top_products' => $this->topProducts($rid, $rangeStart, $rangeEnd, 10),
                'category_sales' => $this->categorySales($rid, $rangeStart, $rangeEnd),
            ],
            'live' => $tablesLive,
            'recent_orders' => $this->recentOrders($rid, 15),
            'staff' => $this->staffPerformance($rid, $rangeStart, $rangeEnd),
            'finance' => [
                'today_expense' => $dailyExpense,
                'month_expense' => $monthlyExpense,
                'today_revenue' => $dailySales,
                'month_revenue' => $monthlySales,
                'profit_today' => $dailyProfit,
                'profit_month' => $monthlySales - $monthlyExpense,
                'income_vs_expense' => $this->incomeVsExpense($rid, 14),
            ],
            'alerts' => $this->buildAlerts($rid, $tablesLive),
            'delivery' => [
                'in_delivery' => QuickOrder::where('restaurant_id', $rid)
                    ->whereHas('order', fn ($q) => $q->where('status', 'approved'))
                    ->whereNotNull('courier_id')
                    ->count(),
                'ready' => QuickOrder::where('restaurant_id', $rid)
                    ->whereHas('order', fn ($q) => $q->where('status', 'approved'))
                    ->whereNull('courier_id')
                    ->count(),
            ],
        ];
    }

    private function card(float $value, float $previous, array $sparkline): array
    {
        return [
            'value' => round($value, 2),
            'trend' => $this->trend($value, $previous),
            'sparkline' => $sparkline,
        ];
    }

    private function trend(float $current, float $previous): array
    {
        if ($previous <= 0) {
            return [
                'percent' => $current > 0 ? 100.0 : 0.0,
                'direction' => $current >= $previous ? 'up' : 'down',
                'previous_value' => round($previous, 2),
            ];
        }
        $pct = (($current - $previous) / $previous) * 100;

        return [
            'percent' => round($pct, 1),
            'direction' => $pct >= 0 ? 'up' : 'down',
            'previous_value' => round($previous, 2),
        ];
    }

    private function resolveRange(string $filter, ?string $from, ?string $to): array
    {
        $now = Carbon::now();
        return match ($filter) {
            'yesterday' => [$now->copy()->subDay()->startOfDay(), $now->copy()->subDay()->endOfDay()],
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            'custom' => [
                Carbon::parse($from ?? $now->toDateString())->startOfDay(),
                Carbon::parse($to ?? $now->toDateString())->endOfDay(),
            ],
            default => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
        };
    }

    private function previousRange(Carbon $start, Carbon $end, string $filter): array
    {
        $days = max(1, $start->diffInDays($end) + 1);
        if ($filter === 'week') {
            return [$start->copy()->subWeek(), $end->copy()->subWeek()];
        }
        if ($filter === 'month') {
            return [$start->copy()->subMonth(), $end->copy()->subMonth()];
        }

        return [$start->copy()->subDays($days), $end->copy()->subDays($days)];
    }

    private function paymentBetween($query, Carbon $start, Carbon $end)
    {
        return $query->where(function ($q) use ($start, $end) {
            $q->whereBetween('close_date', [$start, $end])
                ->orWhereBetween('open_date', [$start, $end]);
        });
    }

    private function sumPayments(string $restaurantId, Carbon $start, Carbon $end): float
    {
        return (float) $this->paymentBetween(
            Payment::where('restaurant_id', $restaurantId),
            $start,
            $end
        )->sum('amount');
    }

    private function sumExpenses(string $restaurantId, Carbon $start, Carbon $end): float
    {
        return (float) Expense::forRestaurant($restaurantId)
            ->active()
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->sum('amount');
    }

    private function dailySalesSeries(string $restaurantId, int $days): array
    {
        $from = Carbon::now()->subDays($days - 1)->startOfDay();
        $rows = Payment::where('restaurant_id', $restaurantId)
            ->where('close_date', '>=', $from)
            ->selectRaw('DATE(close_date) as label, SUM(amount) as value')
            ->groupBy('label')
            ->orderBy('label')
            ->get()
            ->keyBy('label');

        $out = [];
        for ($i = 0; $i < $days; $i++) {
            $d = $from->copy()->addDays($i)->toDateString();
            $out[] = [
                'label' => $d,
                'value' => round((float) ($rows[$d]->value ?? 0), 2),
            ];
        }

        return $out;
    }

    private function weeklySalesSeries(string $restaurantId, int $weeks): array
    {
        $out = [];
        for ($i = $weeks - 1; $i >= 0; $i--) {
            $start = Carbon::now()->startOfWeek()->subWeeks($i);
            $end = $start->copy()->endOfWeek();
            $out[] = [
                'label' => $start->format('d.m'),
                'value' => round($this->sumPayments($restaurantId, $start, $end), 2),
                'current' => $i === 0,
            ];
        }

        return $out;
    }

    private function monthlyRevenueSeries(string $restaurantId, int $months): array
    {
        $out = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $start = Carbon::now()->startOfMonth()->subMonths($i);
            $end = $start->copy()->endOfMonth();
            $out[] = [
                'label' => $start->format('Y-m'),
                'value' => round($this->sumPayments($restaurantId, $start, $end), 2),
            ];
        }

        return $out;
    }

    private function monthlySparkline(string $restaurantId, int $months): array
    {
        return array_map(
            fn ($r) => (float) $r['value'],
            $this->monthlyRevenueSeries($restaurantId, $months)
        );
    }

    private function hourlyOrders(string $restaurantId, Carbon $start, Carbon $end): array
    {
        $rows = Payment::where('restaurant_id', $restaurantId)
            ->whereBetween('close_date', [$start, $end])
            ->selectRaw('HOUR(close_date) as hour, COUNT(DISTINCT order_id) as count')
            ->groupBy('hour')
            ->pluck('count', 'hour');

        $out = [];
        for ($h = 0; $h < 24; $h++) {
            $out[] = ['label' => sprintf('%02d:00', $h), 'value' => (int) ($rows[$h] ?? 0)];
        }

        return $out;
    }

    private function topProducts(string $restaurantId, Carbon $start, Carbon $end, int $limit): array
    {
        $orderIds = Payment::where('restaurant_id', $restaurantId)
            ->whereBetween('close_date', [$start, $end])
            ->distinct()
            ->pluck('order_id');

        if ($orderIds->isEmpty()) {
            return [];
        }

        return DB::table('order_stock')
            ->join('stocks', 'order_stock.stock_id', '=', 'stocks.id')
            ->join('orders', 'order_stock.order_id', '=', 'orders.id')
            ->whereIn('order_stock.order_id', $orderIds)
            ->where('orders.restaurant_id', $restaurantId)
            ->selectRaw('stocks.id, stocks.name, stocks.image, SUM(order_stock.quantity) as qty, SUM(
                COALESCE(
                    (SELECT sd.price FROM stock_details sd WHERE sd.id = order_stock.detail_id),
                    stocks.price
                ) * order_stock.quantity
            ) as revenue')
            ->groupBy('stocks.id', 'stocks.name', 'stocks.image')
            ->orderByDesc('qty')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'image' => $row->image,
                'quantity' => (int) $row->qty,
                'revenue' => round((float) $row->revenue, 2),
                'trend' => ['percent' => 0, 'direction' => 'up', 'previous_value' => 0],
            ])
            ->values()
            ->all();
    }

    private function categorySales(string $restaurantId, Carbon $start, Carbon $end): array
    {
        $orderIds = Payment::where('restaurant_id', $restaurantId)
            ->whereBetween('close_date', [$start, $end])
            ->distinct()
            ->pluck('order_id');

        if ($orderIds->isEmpty()) {
            return [];
        }

        return DB::table('order_stock')
            ->join('stocks', 'order_stock.stock_id', '=', 'stocks.id')
            ->leftJoin('stock_groups', 'stocks.stock_group_id', '=', 'stock_groups.id')
            ->join('orders', 'order_stock.order_id', '=', 'orders.id')
            ->whereIn('order_stock.order_id', $orderIds)
            ->where('orders.restaurant_id', $restaurantId)
            ->selectRaw('COALESCE(stock_groups.name, "Digər") as name, SUM(order_stock.quantity) as qty, SUM(stocks.price * order_stock.quantity) as total')
            ->groupBy('stock_groups.id', 'stock_groups.name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'name' => $r->name,
                'total' => round((float) $r->total, 2),
                'quantity' => (int) $r->qty,
            ])
            ->values()
            ->all();
    }

    private function liveTables(string $restaurantId): array
    {
        $tables = Table::where('restaurant_id', $restaurantId)
            ->with(['tableGroup:id,name'])
            ->get();

        $activeOrderTables = DB::table('table_orders')
            ->join('orders', 'table_orders.order_id', '=', 'orders.id')
            ->where('orders.status', 'approved')
            ->where('orders.restaurant_id', $restaurantId)
            ->select(
                'table_orders.table_id',
                'table_orders.created_at',
                'orders.id as order_id',
                'orders.user_id'
            )
            ->get()
            ->keyBy('table_id');

        $cards = [];
        $active = 0;
        $empty = 0;
        $reserved = 0;
        $awaitingBill = 0;

        foreach ($tables as $table) {
            $orderRow = $activeOrderTables->get($table->id);
            $isBusy = $orderRow !== null;
            if ($isBusy) {
                $active++;
            } else {
                $empty++;
            }

            $total = 0.0;
            if ($isBusy) {
                $order = Order::find($orderRow->order_id);
                $total = $order ? (float) $order->totalAmount() : 0.0;
            }

            $minutes = $isBusy
                ? Carbon::parse($orderRow->created_at)->diffInMinutes(now())
                : 0;

            $status = $isBusy ? 'active' : 'empty';
            if ($isBusy && $total > 0 && $minutes > 90) {
                $status = 'awaiting_bill';
                $awaitingBill++;
            }

            $cards[] = [
                'id' => $table->id,
                'name' => $table->name,
                'status' => $status,
                'guest_count' => null,
                'total' => round($total, 2),
                'elapsed_minutes' => $minutes,
                'group' => $table->tableGroup?->name,
            ];
        }

        $pendingQr = Order::where('restaurant_id', $restaurantId)
            ->where('status', 'pending_approval')
            ->count();

        return [
            'active' => $active,
            'empty' => $empty,
            'reserved' => $reserved,
            'awaiting_bill' => $awaitingBill,
            'pending_qr' => $pendingQr,
            'preparing' => $active,
            'ready' => 0,
            'tables' => $cards,
        ];
    }

    private function orderCounts(string $restaurantId, Carbon $todayStart, Carbon $todayEnd): array
    {
        $today = Payment::where('restaurant_id', $restaurantId)
            ->whereBetween('close_date', [$todayStart, $todayEnd])
            ->distinct('order_id')
            ->count('order_id');

        $yesterdayStart = $todayStart->copy()->subDay();
        $yesterdayEnd = $todayEnd->copy()->subDay();
        $yesterday = Payment::where('restaurant_id', $restaurantId)
            ->whereBetween('close_date', [$yesterdayStart, $yesterdayEnd])
            ->distinct('order_id')
            ->count('order_id');

        $spark = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = $todayStart->copy()->subDays($i);
            $spark[] = (float) Payment::where('restaurant_id', $restaurantId)
                ->whereDate('close_date', $d)
                ->distinct('order_id')
                ->count('order_id');
        }

        $kitchen = Order::where('restaurant_id', $restaurantId)
            ->where('status', 'approved')
            ->whereHas('tableOrders')
            ->count();

        return [
            'today' => $today,
            'yesterday' => $yesterday,
            'spark' => $spark,
            'kitchen_pending' => $kitchen,
        ];
    }

    private function recentOrders(string $restaurantId, int $limit): array
    {
        return Payment::where('restaurant_id', $restaurantId)
            ->orderByDesc('close_date')
            ->limit($limit)
            ->get(['id', 'order_id', 'order_name', 'amount', 'close_date', 'open_date'])
            ->map(function ($p) {
                $status = 'completed';
                $order = Order::find($p->order_id);
                if ($order) {
                    $status = match ($order->status) {
                        'pending_approval' => 'waiting',
                        'approved' => 'preparing',
                        'canceled' => 'cancelled',
                        default => 'served',
                    };
                }

                return [
                    'id' => $p->order_id,
                    'payment_id' => $p->id,
                    'table_name' => $p->order_name ?: '—',
                    'customer_name' => '—',
                    'amount' => round((float) $p->amount, 2),
                    'status' => $status,
                    'datetime' => $p->close_date ?? $p->open_date,
                ];
            })
            ->values()
            ->all();
    }

    private function staffPerformance(string $restaurantId, Carbon $start, Carbon $end): array
    {
        $byCashier = Payment::where('restaurant_id', $restaurantId)
            ->whereBetween('close_date', [$start, $end])
            ->whereNotNull('user_id')
            ->selectRaw('user_id, COUNT(DISTINCT order_id) as orders, SUM(amount) as revenue')
            ->groupBy('user_id')
            ->orderByDesc('orders')
            ->limit(5)
            ->get();

        $userIds = $byCashier->pluck('user_id')->filter();
        $names = DB::table('users')->whereIn('id', $userIds)->pluck('name', 'id');

        $topCashier = $byCashier->first();
        $topSales = $byCashier->sortByDesc('revenue')->first();

        return [
            'top_cashier' => $topCashier ? [
                'name' => $names[$topCashier->user_id] ?? '—',
                'orders' => (int) $topCashier->orders,
            ] : null,
            'top_waiter' => $topCashier ? [
                'name' => $names[$topCashier->user_id] ?? '—',
                'orders' => (int) $topCashier->orders,
            ] : null,
            'top_sales' => $topSales ? [
                'name' => $names[$topSales->user_id] ?? '—',
                'revenue' => round((float) $topSales->revenue, 2),
            ] : null,
            'list' => $byCashier->map(fn ($r) => [
                'user_id' => $r->user_id,
                'name' => $names[$r->user_id] ?? '—',
                'orders' => (int) $r->orders,
                'revenue' => round((float) $r->revenue, 2),
            ])->values()->all(),
        ];
    }

    private function incomeVsExpense(string $restaurantId, int $days): array
    {
        $out = [];
        $from = Carbon::now()->subDays($days - 1)->startOfDay();
        for ($i = 0; $i < $days; $i++) {
            $d = $from->copy()->addDays($i);
            $out[] = [
                'label' => $d->format('d.m'),
                'income' => round($this->sumPayments($restaurantId, $d->copy()->startOfDay(), $d->copy()->endOfDay()), 2),
                'expense' => round($this->sumExpenses($restaurantId, $d->copy()->startOfDay(), $d->copy()->endOfDay()), 2),
            ];
        }

        return $out;
    }

    private function buildAlerts(string $restaurantId, array $live): array
    {
        $alerts = [];

        $lowStock = Stock::where('restaurant_id', $restaurantId)
            ->where('alert_critical', true)
            ->whereColumn('amount', '<=', 'critical_amount')
            ->limit(8)
            ->get(['id', 'name', 'amount', 'critical_amount']);

        foreach ($lowStock as $s) {
            $alerts[] = [
                'type' => 'low_stock',
                'severity' => 'warning',
                'title' => 'Azalan stok',
                'message' => "{$s->name}: {$s->amount} qaldı (kritik: {$s->critical_amount})",
            ];
        }

        if ($live['pending_qr'] > 0) {
            $alerts[] = [
                'type' => 'pending_order',
                'severity' => 'info',
                'title' => 'QR sifariş gözləyir',
                'message' => "{$live['pending_qr']} sifariş təsdiq gözləyir",
            ];
        }

        foreach ($live['tables'] as $t) {
            if ($t['status'] === 'awaiting_bill' && $t['elapsed_minutes'] > 120) {
                $alerts[] = [
                    'type' => 'long_table',
                    'severity' => 'warning',
                    'title' => 'Uzun müddətli masa',
                    'message' => "{$t['name']}: {$t['elapsed_minutes']} dəq açıqdır",
                ];
            }
        }

        $bigExpense = Expense::forRestaurant($restaurantId)
            ->active()
            ->whereDate('expense_date', Carbon::today())
            ->where('amount', '>=', 500)
            ->orderByDesc('amount')
            ->first();

        if ($bigExpense) {
            $alerts[] = [
                'type' => 'large_expense',
                'severity' => 'info',
                'title' => 'Böyük xərc',
                'message' => "{$bigExpense->name}: " . number_format((float) $bigExpense->amount, 2) . ' ₼',
            ];
        }

        return array_slice($alerts, 0, 12);
    }
}
