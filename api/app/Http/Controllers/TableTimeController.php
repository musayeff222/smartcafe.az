<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\TableTimeSessionService;
use App\Models\TableTimeSession;
use App\Models\TimeCharge;

class TableTimeController extends Controller
{
    public function __construct(private TableTimeSessionService $svc) {}

    public function status(int $table)
    {
        return response()->json($this->svc->statusForTable($table));
    }

    public function startPerMinute(Request $r, int $table)
    {
        $data = $r->validate([
            'order_id'          => ['nullable','integer'],
            'minute_rate_qepik' => ['required','integer','min:1'],
        ]);
        $s = $this->svc->startPerMinute($table, $data['order_id'] ?? null, $data['minute_rate_qepik']);
        return response()->json($s, 201);
    }

    public function startPreset(Request $r, int $table)
    {
        $data = $r->validate([
            'order_id'  => ['nullable','integer'],
            'preset_id' => ['required','integer','exists:time_presets,id'],
        ]);
        $s = $this->svc->startPreset($table, $data['order_id'] ?? null, $data['preset_id']);
        return response()->json($s, 201);
    }

    public function extend(Request $r, int $table)
    {
        $s = $this->svc->statusForTable($table);
        abort_if(!$s, 404, 'Aktiv sessiya tapılmadı.');

        $data = $r->validate([
            'mode'              => ['required','in:minutes,preset'],
            'minutes'           => ['required_if:mode,minutes','integer','min:1'],
            'minute_rate_qepik' => ['required_if:mode,minutes','integer','min:1'],
            'preset_id'         => [
                'required_if:mode,preset','integer',
                Rule::exists('time_presets','id')->where(function ($q) use ($table) {
                    $q->where('is_active',1)
                        ->where(function($qq) use ($table){
                            $qq->whereNull('table_id')->orWhere('table_id',$table);
                        });
                }),
            ],
            'order_id'          => ['nullable','integer'],
            'note'              => ['nullable','string','max:500'],
            'start_immediately' => ['boolean'],
        ]);

        $order = $this->resolveOrCreateApprovedOrder($r, $table, $data['order_id'] ?? $s->order_id);
        $data['order_id'] = $order->id;

        if ($data['mode'] === 'preset') {
            // seçilən preset həqiqətən bu masa üçün əlçatandırmı — birdə daha yoxla
            $preset = TimePreset::forTable($table)->findOrFail($data['preset_id']);
            $data['preset_id'] = $preset->id;
        }

        $res = $data['mode'] === 'minutes'
            ? $this->svc->extendByMinutes($s->id, $data)
            : $this->svc->extendByPreset($s->id, $data);

        return response()->json($res, 201);
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

    // Admin siyahıları
    public function index(Request $r)
    {
        $q = TableTimeSession::query()
            ->when($r->table_id, fn($x)=>$x->where('table_id',$r->table_id))
            ->when($r->status, fn($x)=>$x->where('status',$r->status))
            ->when($r->from, fn($x)=>$x->whereDate('created_at','>=',$r->from))
            ->when($r->to, fn($x)=>$x->whereDate('created_at','<=',$r->to))
            ->latest();

        return $q->paginate(20);
    }

    public function show(int $id)
    {
        return TableTimeSession::findOrFail($id);
    }

    public function orderCharges(int $order)
    {
        return TimeCharge::where('order_id',$order)
            ->latest()->get();
    }
}
