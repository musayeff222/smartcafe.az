<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\TableTimeSessionService;
use App\Models\TableTimeSession;
use App\Models\TimeCharge;
use App\Models\Table;
use App\Models\TableOrder;
use App\Models\Order;

class TableTimeSessionController extends Controller
{
    public function __construct(private TableTimeSessionService $svc) {}

    // Masada aktiv sessiyanın statusu
    public function status(int $table)
    {
        return response()->json($this->svc->statusForTable($table));
    }

    // Per-minute sessiya başlat
    public function startPerMinute(Request $r, int $table)
    {
        $data = $r->validate([
            'order_id'          => ['nullable','integer'],
            'minute_rate_qepik' => ['required','integer','min:1'],
        ]);

        // ✅ HƏR ZAMAN order-i həll et (verilibsə yoxla, verilməyibsə masadakı approved-u tap, yoxdursa yarat)
        $order = $this->resolveOrCreateApprovedOrder($r, $table, $data['order_id'] ?? null);

        $s = $this->svc->startPerMinute($table, $order->id, $data['minute_rate_qepik']);
        return response()->json($s, 201);
    }

    // Preset sessiya başlat
    public function startPreset(Request $r, int $table)
    {
        $data = $r->validate([
            'order_id'  => ['nullable','integer'],
            'preset_id' => ['required','integer','exists:time_presets,id'],
        ]);

        $order = $this->resolveOrCreateApprovedOrder($r, $table, $data['order_id'] ?? null);

        $s = $this->svc->startPreset($table, $order->id, $data['preset_id']);
        return response()->json($s, 201);
    }

    public function pause(int $table)
    {
        $s = $this->svc->statusForTable($table);
        abort_if(!$s, 404, 'Aktiv sessiya tapılmadı.');
        return $this->svc->pause($s->id);
    }

    public function resume(int $table)
    {
        $s = $this->svc->statusForTable($table);
        abort_if(!$s, 404, 'Aktiv sessiya tapılmadı.');
        if ($s->status !== 'paused') abort(422, 'Status paused olmalıdır.');
        return $this->svc->resume($s->id);
    }

    public function finish(int $table)
    {
        $s = $this->svc->statusForTable($table);
        abort_if(!$s, 404, 'Aktiv sessiya tapılmadı.');
        return $this->svc->finish($s->id);
    }

    public function index(Request $r)
    {
        $q = TableTimeSession::query()
            ->when($r->table_id, fn($x) => $x->where('table_id', $r->table_id))
            ->when($r->status, fn($x) => $x->where('status', $r->status))
            ->when($r->from, fn($x) => $x->whereDate('created_at', '>=', $r->from))
            ->when($r->to, fn($x) => $x->whereDate('created_at', '<=', $r->to))
            ->latest();

        return $q->paginate(20);
    }

    public function show(int $id)
    {
        return TableTimeSession::findOrFail($id);
    }

    public function orderCharges(int $order)
    {
        return TimeCharge::where('order_id', $order)->latest()->get();
    }
    public function indexChargesByOrder(Request $r, int $orderId)
    {
        $rid = (int) $r->user()->restaurant_id;

        // 1) Order-i tap (multi-tenant filtr ilə)
        $order = Order::query()
            // superadmin/sahibdirsə filtr tətbiq etməyi istəmirsinizsə, buraya rol yoxlaması qoya bilərsiniz:
            // ->when(!$r->user()->hasRole('superadmin'), fn($q) => $q->where('restaurant_id', $rid))
            ->where('id', $orderId)
            ->where('restaurant_id', $rid)
            ->first();

        if (!$order) {
            abort(404, 'Order tapılmadı və ya bu restorana aid deyil.');
        }

        // 2) Charges siyahısı (opsional tarix filtrləri + paginate)
        $q = TimeCharge::where('order_id', $order->id)
            ->when($r->from, fn($x)=>$x->whereDate('created_at','>=',$r->from))
            ->when($r->to,   fn($x)=>$x->whereDate('created_at','<=',$r->to))
            ->latest();

        if ($r->boolean('paginate')) {
            return $q->paginate(20, ['id','order_id','table_time_session_id','title','amount','created_at']);
        }

        return $q->get(['id','order_id','table_time_session_id','title','amount','created_at']);
    }

    public function extend(Request $r, int $table)
    {
        // aktiv sessiyanı götür
        $s = $this->svc->statusForTable($table);
        abort_if(!$s, 404, 'Aktiv sessiya tapılmadı.');

        // Front modalından gələcək data
        $data = $r->validate([
            'mode'              => ['required','in:minutes,preset'],
            'minutes'           => ['required_if:mode,minutes','integer','min:1'],
            'minute_rate_qepik' => ['required_if:mode,minutes','integer','min:1'],
            'preset_id'         => ['required_if:mode,preset','integer','exists:time_presets,id'],
            'order_id'          => ['nullable','integer'],
            'note'              => ['nullable','string','max:500'],
//            'start_immediately' => ['boolean'],
        ]);

        // Əgər order id verilibsə, sizin artıq qurduğunuz qaydaya uyğun həll edək:
        $order = $this->resolveOrCreateApprovedOrder($r, $table, $data['order_id'] ?? $s->order_id);
        // sessiyanın order_id-sini qorumaq/yeniləmək üçün servisdə də ötürəcəyik
        $data['order_id'] = $order->id;

        $res = $data['mode'] === 'minutes'
            ? $this->svc->extendByMinutes($s->id, $data)
            : $this->svc->extendByPreset($s->id, $data);

        return response()->json($res, 201);
    }




    /**
     * Masa üçün APPROVED order-i tapır və ya yaradır.
     * - $orderId verilibsə: həmin order restoran+masa ilə uyğun olmalıdır; yoxsa 422 qaytarırıq.
     * - verilməyibsə: masanın mövcud APPROVED order-i varsa onu qaytarır; yoxdursa yenisini yaradır və masaya bağlayır.
     */
    private function resolveOrCreateApprovedOrder(Request $r, int $tableId, ?int $orderId): Order
    {
        return DB::transaction(function () use ($r, $tableId, $orderId) {
            // Masanı və restoranı yoxla
            $table = Table::where('restaurant_id', $r->user()->restaurant_id)->findOrFail($tableId);

            // 1) order_id verilibsə — doğrula və masaya bağlanmasını təmin et
            if ($orderId) {
                $order = Order::where('restaurant_id', $table->restaurant_id)->findOrFail($orderId);

                // Bu order həmin masaya bağlıdırmı? (table_orders pivot)
                $attached = TableOrder::where('order_id', $order->id)
                    ->where('table_id', $table->id)
                    ->exists();

                if (!$attached) {
                    // Eyni masada başqa APPROVED order varsa, kolliziya yaratmamaq üçün 422 ver
                    $hasApprovedOnTable = TableOrder::where('table_id', $table->id)
                        ->whereHas('order', fn($q)=>$q->where('status','approved'))
                        ->exists();

                    if ($hasApprovedOnTable) {
                        abort(422, 'Bu masada artıq approved order var.');
                    }

                    // Əks halda order-i bu masaya bağla
                    TableOrder::create([
                        'table_id'      => $table->id,
                        'order_id'      => $order->id,
                        'restaurant_id' => $table->restaurant_id,
                    ]);
                }

                // Pending gəlmişsə, vaxt üçün approved istədiyinə görə approved-a çevir
                if ($order->status !== 'approved') {
                    $order->update([
                        'status'  => 'approved',
                        'user_id' => $r->user()->id,
                    ]);
                }

                return $order;
            }

            // 2) order_id verilməyibsə — bu masada mövcud APPROVED varsa onu götür
            $approvedTableOrder = TableOrder::where('table_id', $table->id)
                ->where('restaurant_id', $table->restaurant_id)
                ->whereHas('order', fn($q)=>$q->where('status','approved'))
                ->latest()
                ->first();

            if ($approvedTableOrder) {
                return $approvedTableOrder->order;
            }

            // 3) Yoxdursa — YENİ APPROVED order yarat və masaya bağla
            $order = Order::create([
                'restaurant_id' => $table->restaurant_id,
                'status'        => 'approved',
                'user_id'       => $r->user()->id,
            ]);

            TableOrder::create([
                'table_id'      => $table->id,
                'order_id'      => $order->id,
                'restaurant_id' => $table->restaurant_id,
            ]);

            return $order;
        });
    }
}
