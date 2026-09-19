import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Bot,
  Send,
  Save,
  Loader2,
  ShieldAlert,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react";
import { base_url } from "../api/index";

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const CHANNEL_GROUPS = [
  {
    title: "Masa və sifariş",
    keys: ["order_new", "order_changed", "order_item_removed", "table_open_close"],
  },
  {
    title: "Ödəniş",
    keys: ["payments", "refunds", "discounts"],
  },
  {
    title: "Anbar",
    keys: ["stock_in", "stock_out", "stock_critical", "stock_empty"],
  },
  {
    title: "İşçi və hesabat",
    keys: ["staff_ops", "cashier_ops", "daily_report"],
  },
];

function Switch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? "bg-indigo-600" : "bg-slate-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function TelegramBotSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [data, setData] = useState(null);
  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [events, setEvents] = useState({});
  const [dailyOn, setDailyOn] = useState(false);
  const [dailyTime, setDailyTime] = useState("22:00");

  const load = async () => {
    const res = await axios.get(`${base_url}/restaurant/telegram-settings`, getAuthHeaders());
    const d = res.data;
    setData(d);
    setChatId(d.chat_id || "");
    setEnabled(!!d.is_enabled);
    setEvents(d.notify_events || {});
    setDailyOn(!!d.daily_report_enabled);
    setDailyTime(d.daily_report_time || "22:00");
    setToken("");
  };

  useEffect(() => {
    load()
      .catch(() => toast.error("Telegram ayarları yüklənmədi"))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const payload = {
        chat_id: chatId.trim() || null,
        is_enabled: enabled,
        notify_events: events,
        daily_report_enabled: dailyOn,
        daily_report_time: dailyTime,
      };
      if (token.trim()) payload.bot_token = token.trim();
      const res = await axios.put(`${base_url}/restaurant/telegram-settings`, payload, getAuthHeaders());
      toast.success(res.data.message || "Yadda saxlandı");
      setToken("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Saxlanmadı");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const res = await axios.post(`${base_url}/restaurant/telegram-settings/test`, {}, getAuthHeaders());
      toast.success(res.data.message || "Test göndərildi");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Test getmədi");
      try {
        await load();
      } catch (e) {}
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
        <Loader2 size={18} className="animate-spin" /> Yüklənir…
      </div>
    );
  }

  if (!data?.available) {
    return (
      <div className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 grid place-items-center shrink-0">
            <ShieldAlert size={20} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Telegram Bot bağlıdır</h2>
            <p className="text-sm text-slate-600 mt-1">
              Bu funksiya sizin tarifinizdə aktiv deyil. Super-admin paneldə restoranın paketinə
              Telegram Bot əlavə edilməlidir.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const conn = data.connection || {};
  const labels = data.channels || {};

  return (
    <form onSubmit={save} className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">Telegram Bot</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Restoranda baş verən əməliyyatlar seçdiyiniz Telegram hesabına göndərilir.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
              <Bot size={16} className="text-indigo-600" />
            </span>
            Bot statusu
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{enabled ? "Aktiv" : "Deaktiv"}</span>
            <Switch checked={enabled} onChange={setEnabled} />
          </div>
        </div>

        <div
          className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
            conn.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : conn.ready
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-white text-slate-600"
          }`}
        >
          {conn.ok ? <Wifi size={16} className="mt-0.5 shrink-0" /> : <WifiOff size={16} className="mt-0.5 shrink-0" />}
          <div>
            <div className="font-medium">
              {conn.ok
                ? "Bağlantı uğurludur"
                : conn.ready
                  ? "Ayarlar doludur, test edin"
                  : "Token və Chat ID daxil edin"}
            </div>
            {conn.last_error && (
              <div className="text-xs mt-0.5 opacity-80">{conn.last_error}</div>
            )}
          </div>
        </div>

        <label className="block text-sm">
          <span className="block mb-1 font-medium text-slate-700">Bot Token</span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={data.bot_token_set ? "Saxlanılıb — dəyişmək üçün yeni token yazın" : "123456:ABC..."}
            autoComplete="off"
            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <span className="mt-1 block text-[11px] text-slate-500">
            Token ekranda göstərilmir və şifrələnərək saxlanır. @BotFather-dən alın.
          </span>
        </label>

        <label className="block text-sm">
          <span className="block mb-1 font-medium text-slate-700">Telegram Chat ID</span>
          <input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="123456789 və ya -100..."
            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </label>

        <button
          type="button"
          onClick={test}
          disabled={testing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          Test mesajı göndər
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <h3 className="font-semibold text-slate-800 text-sm">Bildiriş növləri</h3>
        <p className="text-xs text-slate-500 -mt-2">Yalnız işarələnənlər Telegram-a göndərilir.</p>
        {CHANNEL_GROUPS.map((g) => (
          <div key={g.title}>
            <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-400 mb-2">
              {g.title}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {g.keys.map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-sm cursor-pointer hover:border-indigo-200"
                >
                  <input
                    type="checkbox"
                    checked={!!events[key]}
                    onChange={(e) => setEvents((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700">{labels[key] || key}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
            <Clock size={16} className="text-indigo-600" />
            Günlük hesabat
          </div>
          <Switch
            checked={dailyOn}
            onChange={(v) => {
              setDailyOn(v);
              setEvents((prev) => ({ ...prev, daily_report: v ? true : prev.daily_report }));
            }}
          />
        </div>
        <label className="block text-sm max-w-[12rem]">
          <span className="block mb-1 font-medium text-slate-700">Göndərmə saatı</span>
          <input
            type="time"
            value={dailyTime}
            onChange={(e) => setDailyTime(e.target.value)}
            disabled={!dailyOn}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Yadda saxla
        </button>
      </div>
    </form>
  );
}
