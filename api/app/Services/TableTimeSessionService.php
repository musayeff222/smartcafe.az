<?php

namespace App\Services;

use App\Models\{TableTimeSession, TimePreset, TimeCharge};
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

/**
 * PS Club vaxt idarəetmə servisi
 *
 * Qaydalar:
 * - per_minute: dəqiqəlik tarif (qəpik). Yekun məbləğ = ceil(seconds/60) * rate_qepik / 100.
 * - preset: paket (target_minutes + fixed price). Vaxt bitdikdə siyasət:
 *      config('psclub.preset_overage') = 'stop' | 'per_minute' | 'none'
 *      - stop: vaxt bitən kimi dayandırırıq (UI və ya server call ilə).
 *      - per_minute: target-dən artıq keçən saniyələr üçün ayrıca dəqiqəlik tarif.
 *      - none: həmişə yalnız paket qiyməti.
 *
 * Qeyd:
 * - Server “source of truth”dur: actual_seconds yığılır, yekun `finish()`-də bağlanır.
 * - Concurrency üçün bütün dəyişən əməliyyatlar transaction + lockForUpdate ilədir.
 */
class TableTimeSessionService
{
    // ---- Public API ------------------------------------------------------

    private function asCarbon($value): ?Carbon
    {
        if ($value instanceof Carbon) return $value;
        if (empty($value)) return null;
        try { return Carbon::parse($value); } catch (\Throwable $e) { return null; }
    }



    /**
     * Per-minute rejimində sessiya başladır.
     */
    public function startPerMinute(int $tableId, ?int $orderId, int $minuteRateQepik): TableTimeSession
    {
        return DB::transaction(function () use ($tableId, $orderId, $minuteRateQepik) {
            $this->ensureNoActiveSession($tableId, true);

            $session = TableTimeSession::create([
                'table_id'          => $tableId,
                'order_id'          => $orderId,
                'status'            => 'running',
                'started_at'        => now(),
                'billing_mode'      => 'per_minute',
                'minute_rate_qepik' => $minuteRateQepik,
                'actual_seconds'    => 0,
                'amount'            => 0,
            ]);

            $this->fireUpdated($session);

            return $session->fresh();
        });
    }

    /**
     * Preset (paket) rejimində sessiya başladır.
     */
    public function startPreset(int $tableId, ?int $orderId, int $presetId): TableTimeSession
    {
        return DB::transaction(function () use ($tableId, $orderId, $presetId) {
            $this->ensureNoActiveSession($tableId, true);

            /** @var TimePreset $preset */
            $preset = TimePreset::where('is_active', 1)->findOrFail($presetId);

            $session = TableTimeSession::create([
                'table_id'        => $tableId,
                'order_id'        => $orderId,
                'status'          => 'running',
                'started_at'      => now(),
                'billing_mode'    => 'preset',
                'time_preset_id'  => $preset->id,
                'target_minutes'  => $preset->minutes,
                'actual_seconds'  => 0,
                'amount'          => $preset->price, // fixed qiymət
            ]);

            $this->fireUpdated($session);

            return $session->fresh();
        });
    }

    /**
     * Running sessiyanı pauzaya salır.
     */
    public function pause(int $sessionId): TableTimeSession
    {
        return DB::transaction(function () use ($sessionId) {
            $s = TableTimeSession::lockForUpdate()->findOrFail($sessionId);
            if ($s->status !== 'running') $this->fail("Yalnız 'running' pauzalanır.");

            $now   = now();
            $start = $s->started_at; // artıq Carbon olacaq (casts sayəsində)

            if ($start && $start->lte($now)) {
                $delta = (int) $start->diffInSeconds($now);
                $s->actual_seconds = max(0, (int)($s->actual_seconds ?? 0) + $delta);
            }

            $s->status     = 'paused';
            $s->paused_at  = $now;

            // 🚫 vacib: intervalı bağlayırıq ki, finish() iki dəfə toplamasın
            $s->started_at = null;

            $s->save();
            $this->fireUpdated($s);
            return $s->fresh();
        });
    }


    public function resume(int $sessionId): TableTimeSession
    {
        return DB::transaction(function () use ($sessionId) {
            $s = TableTimeSession::lockForUpdate()->findOrFail($sessionId);
            if ($s->status !== 'paused') {
                $this->fail("Yalnız 'paused' bərpa olunur.");
            }

            $now    = now();
            $paused = $this->asCarbon($s->paused_at);

            // Corrected calculation for paused duration
            $deltaPaused = 0;
            if ($paused && $paused->lessThanOrEqualTo($now)) {
                // Correct order to get a positive difference
                $deltaPaused = (int) $paused->diffInSeconds($now);
            }
            $s->paused_seconds = max(0, (int)($s->paused_seconds ?? 0) + $deltaPaused);

            $s->status     = 'running';
            $s->started_at = $now;   // yeni interval başlanğıcı
            $s->paused_at  = null;
            $s->save();

            $this->fireUpdated($s);
            return $s->fresh();
        });
    }

    public function finish(int $sessionId): TableTimeSession
    {
        return DB::transaction(function () use ($sessionId) {
            $s = TableTimeSession::lockForUpdate()->findOrFail($sessionId);
            if (!in_array($s->status, ['running','paused'])) $this->fail("Bu sessiya artıq bitib və ya aktiv deyil.");

            $now = now();

            if ($s->status === 'running') {
                // RUNNING: son intervalı indi bağla
                if ($s->started_at && $s->started_at->lte($now)) {
                    $delta = (int) $s->started_at->diffInSeconds($now);
                    $s->actual_seconds = max(0, (int)$s->actual_seconds + $delta);
                }
            } else { // paused
                // LEGACY FALLBACK: köhnə qeydlərdə pause() started_at-ı null etməmiş ola bilər
                if ($s->started_at && $s->paused_at && $s->started_at->lte($s->paused_at)) {
                    $delta = (int) $s->started_at->diffInSeconds($s->paused_at);
                    $s->actual_seconds = max(0, (int)$s->actual_seconds + $delta);
                }
            }

            // Yekun məbləğ
            if ($s->billing_mode === 'per_minute') {
                $s->amount = $this->calcPerMinuteAmount((int)$s->actual_seconds, (int)$s->minute_rate_qepik);
            } else {
                $policy = config('psclub.preset_overage', 'stop'); // stop|per_minute|none
                if ($policy === 'per_minute' && $s->target_minutes) {
                    $allowed = (int)$s->target_minutes * 60;
                    if ($s->actual_seconds > $allowed) {
                        $over = (int)$s->actual_seconds - $allowed;
                        $rate = (int)(config('psclub.preset_overage_rate_qepik', $s->minute_rate_qepik ?: 0));
                        if ($rate > 0) {
                            $s->amount = (float)$s->amount + (float)$this->calcPerMinuteAmount($over, $rate);
                        }
                    }
                }
            }

            $s->ended_at = $now;
            $s->status   = 'finished';
            $s->save();

            if ($s->order_id && $s->amount > 0) {
                TimeCharge::create([
                    'table_time_session_id' => $s->id,
                    'order_id'              => $s->order_id,
                    'title'                 => $this->chargeTitle($s),
                    'amount'                => $s->amount,
                ]);
            }

            $this->fireUpdated($s);
            return $s->fresh();
        });
    }


    /**
     * Verilən masa üçün aktiv sessiyanı qaytarır (running|paused), yoxdursa null.
     */
    public function statusForTable(int $tableId): ?TableTimeSession
    {
        return TableTimeSession::where('table_id', $tableId)
            ->whereIn('status', ['running', 'paused'])
            ->latest('id')
            ->first();
    }

    // ---- Helpers / Internal ---------------------------------------------

    /**
     * Həmin masada aktiv sessiyanın olmamasını təmin et.
     */
    protected function ensureNoActiveSession(int $tableId, bool $lock = false): void
    {
        $q = TableTimeSession::where('table_id', $tableId)
            ->whereIn('status', ['running', 'paused']);

        if ($lock) {
            $q->lockForUpdate();
        }
        if ($q->exists()) {
            $this->fail('Bu masada aktiv sessiya var.');
        }
    }

    /**
     * Dəqiqəlik məbləği hesablayır (ceil).
     */
    protected function calcPerMinuteAmount(int $seconds, int $rateQepik): float
    {
        $minutes = (int) ceil($seconds / 60);
        $qepik   = $minutes * $rateQepik;
        return round($qepik / 100, 2);
    }

    /**
     * Charge üçün title formatı.
     */
    protected function chargeTitle(TableTimeSession $s): string
    {
        return $s->billing_mode === 'preset'
            ? "PS vaxtı ({$s->target_minutes} dəq paket)"
            : "PS vaxtı (" . ceil($s->actual_seconds / 60) . " dəq)";
    }




    // App/Services/TableTimeSessionService.php

    public function extendByMinutes(int $sessionId, array $p): array
    {
        return DB::transaction(function () use ($sessionId, $p) {
            /** @var TableTimeSession $s */
            $s = TableTimeSession::lockForUpdate()->findOrFail($sessionId);
            if (!in_array($s->status, ['running','paused'])) {
                $this->fail("Bu sessiyaya vaxt əlavə edilə bilməz.");
            }

            // Order-i (verilibsə) sessiyaya bağla
            if (!empty($p['order_id']) && $s->order_id !== (int)$p['order_id']) {
                $s->order_id = (int)$p['order_id'];
            }

            // Paused idisə, start_immediately=TRUE ilə running-ə qaytaraq
            if (($p['start_immediately'] ?? true) && $s->status === 'paused') {
                // pause intervalını qapatmırıq; sizdə resume() bunu edir.
                // Sadəcə statusu 'running' edib yeni interval başlama nöqtəsini indi qoymaq məqsədəuyğundur:
                $s->status     = 'running';
                $s->started_at = now();
                $s->paused_at  = null;
            }

            $minutes = (int)($p['minutes'] ?? 0);
            $rate    = (int)($p['minute_rate_qepik'] ?? 0);

            if ($s->billing_mode === 'preset') {
                // PRESET sessiyanı dəqiqə ilə UZATMA: target_minutes artır, qiyməti toplama əlavə et
                if ($minutes < 1 || $rate < 1) {
                    $this->fail('minutes və minute_rate_qepik tələb olunur.');
                }

                $s->target_minutes = max(0, (int)($s->target_minutes ?? 0) + $minutes);
                // top-up dəyərini manata çevirib ümumi amount-a əlavə edirik
                $s->amount = (float)$s->amount + round(($minutes * $rate) / 100, 2);

                // Referans üçün son istifadə olunan dəqiqəlik tarifi saxlayın (overage üçün də yararlı ola bilər)
                $s->minute_rate_qepik = $rate;
            } else {
                // PER_MINUTE sessiyada real vaxt sayılır; sadəcə tarifi yeniləmək kifayətdir
                if ($rate >= 1) {
                    $s->minute_rate_qepik = $rate;
                }
                // amount burada artmır; finish() vaxtında faktiki saniyələrə görə hesablanaq.
            }

            $s->save();

            // Ayrı sətir kimi charge yazmaq istəsəniz, burda əlavə edin (opsional).
            // Hal-hazırda yekun ödənişi finish() bir dəfə yaradır; ona görə double-billing etməmək üçün
            // indi ayrıca TimeCharge yaratmırıq.

            $this->fireUpdated($s);
            return ['session' => $s->fresh()];
        });
    }

    public function extendByPreset(int $sessionId, array $p): array
    {
        return DB::transaction(function () use ($sessionId, $p) {
            /** @var TableTimeSession $s */
            $s = TableTimeSession::lockForUpdate()->findOrFail($sessionId);
            if (!in_array($s->status, ['running','paused'])) {
                $this->fail("Bu sessiyaya vaxt əlavə edilə bilməz.");
            }

            // Yalnız PRESET sessiyalarda preset-lə uzatma edirik
            if ($s->billing_mode !== 'preset') {
                $this->fail("Per-minute sessiya preset ilə uzadıla bilməz.");
            }

            // Order-i (verilibsə) sessiyaya bağla
            if (!empty($p['order_id']) && $s->order_id !== (int)$p['order_id']) {
                $s->order_id = (int)$p['order_id'];
            }

            // preset-i oxu
            /** @var \App\Models\TimePreset $preset */
            $preset = \App\Models\TimePreset::where('is_active', 1)->findOrFail((int)$p['preset_id']);

            // Paused idisə və start_immediately=TRUE isə dərhal davam
            if (($p['start_immediately'] ?? true) && $s->status === 'paused') {
                $s->status     = 'running';
                $s->started_at = now();
                $s->paused_at  = null;
            }

            // hədəf dəqiqələri artır
            $s->target_minutes = max(0, (int)($s->target_minutes ?? 0) + (int)$preset->minutes);
            // qiyməti toplama əlavə et (manat formatınız already float-dir)
            $s->amount = (float)$s->amount + (float)$preset->price;

            $s->save();

            // Burada da ayrıca TimeCharge yaratmırıq; yekun finish() bir dəfəlik total charge yaradır.

            $this->fireUpdated($s);
            return [
                'session' => $s->fresh(),
                'added'   => [
                    'preset_id' => $preset->id,
                    'minutes'   => (int)$preset->minutes,
                    'price'     => (float)$preset->price,
                ],
            ];
        });
    }








    /**
     * ValidationException helper (422).
     */
    protected function fail(string $message): void
    {
        throw ValidationException::withMessages(['session' => $message]);
    }

    /**
     * UI sinxronu üçün event fire (isteğe bağlı).
     * App\Events\TableTimeSessionUpdated should implement ShouldBroadcast (PrivateChannel: table.{table_id})
     */
    protected function fireUpdated(TableTimeSession $session): void
    {
        try {
            event(new \App\Events\TableTimeSessionUpdated($session->fresh()));
        } catch (\Throwable $e) {
            // event sistemi bağlı ola bilər – sakit keçirik
        }
    }
}
