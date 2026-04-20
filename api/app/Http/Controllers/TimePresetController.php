<?php

namespace App\Http\Controllers;

use App\Models\TimePreset;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TimePresetController extends Controller
{
    /**
     * Siyahı:
     * - table_id MÜTLƏQDIR və yalnız həmin masanın presetləri qaytarılır
     * - ?include_inactive=1 verilsə, passivlər də daxil
     */
    public function index(Request $r)
    {
        $rid = $r->user()->restaurant_id;

        $data = $r->validate([
            'table_id'         => ['required','integer',
                Rule::exists('tables','id')->where(fn($q)=>$q->where('restaurant_id',$rid))
            ],
            'include_inactive' => ['sometimes','boolean'],
        ]);

        $tableId      = (int) $data['table_id'];
        $withInactive = (bool)($data['include_inactive'] ?? false);

        $q = TimePreset::query()
            ->where('restaurant_id', $rid)
            ->where('table_id', $tableId)
            ->when(!$withInactive, fn($x)=>$x->where('is_active', 1))
            ->orderBy('minutes');

        return $q->get(['id','name','minutes','price','is_active','table_id']);
    }

    /**
     * Yarat:
     * - table_id MÜTLƏQDIR və preset yalnız həmin masaya yaradılır
     * - Eyni (restaurant_id, table_id, name) kombinasiyası üçün unikallıq
     */
    public function store(Request $r)
    {
        $rid = $r->user()->restaurant_id;

        $data = $r->validate([
            'name'      => ['required','string','max:190'],
            'minutes'   => ['required','integer','min:1'],
            'price'     => ['required','numeric','min:0'],
            'is_active' => ['boolean'],
            'table_id'  => ['required','integer',
                Rule::exists('tables','id')->where(fn($q)=>$q->where('restaurant_id',$rid))
            ],
        ]);
        
        $preset = TimePreset::create([
            'restaurant_id' => $rid,
            'table_id'      => $data['table_id'],
            'name'          => $data['name'],
            'minutes'       => $data['minutes'],
            'price'         => $data['price'],
            'is_active'     => $data['is_active'] ?? true,
        ]);

        return response()->json($preset->only('id','name','minutes','price','is_active','table_id'), 201);
    }

    /**
     * Yenilə:
     * - Yalnız eyni restoranın preset-i
     * - table_id DƏYİŞMİR (əgər lazım olsa ayrıca endpoint)
     * - Ad dəyişəndə eyni masa daxilində unikallıq qorunur
     */
    public function update(Request $r, TimePreset $time_preset)
    {
        $rid = $r->user()->restaurant_id;
        abort_unless($time_preset->restaurant_id === $rid, 404);

        $data = $r->validate([
            'name'      => ['sometimes','string','max:190',
                Rule::unique('time_presets','name')->ignore($time_preset->id)->where(function($q) use ($rid, $time_preset){
                    $q->where('restaurant_id',$rid)
                        ->where('table_id',$time_preset->table_id);
                })
            ],
            'minutes'   => ['sometimes','numeric'],
            'price'     => ['sometimes','numeric','min:0'],
            'is_active' => ['sometimes','boolean'],
        ]);

        $time_preset->update($data);
        return $time_preset->only('id','name','minutes','price','is_active','table_id');
    }

    public function destroy(TimePreset $time_preset)
    {
        $rid = auth()->user()->restaurant_id;
        abort_unless($time_preset->restaurant_id === $rid, 404);

        $time_preset->delete();
        return response()->noContent();
    }
}
