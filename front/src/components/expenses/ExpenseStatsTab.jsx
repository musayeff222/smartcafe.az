import React, { useEffect, useState } from "react";
import { expensesApi } from "../../api/expensesApi";

const Box = "div";

function BarChart({ data, labelKey, valueKey, maxHeight = 120 }) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  return (
    <Box className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <Box key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <Box
            className="w-full bg-indigo-500 rounded-t"
            style={{ height: `${(Number(d[valueKey]) / max) * maxHeight}px` }}
            title={`${d[labelKey]}: ${d[valueKey]}`}
          />
          <span className="text-[9px] text-slate-400 truncate w-full text-center">
            {String(d[labelKey]).slice(5)}
          </span>
        </Box>
      ))}
    </Box>
  );
}

function PieLegend({ data }) {
  const total = data.reduce((s, d) => s + Number(d.total), 0) || 1;
  const colors = ["#4f46e5", "#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
  return (
    <ul className="space-y-1.5 text-sm">
      {data.map((d, i) => (
        <li key={i} className="flex justify-between gap-2">
          <span className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
            {d.name}
          </span>
          <span className="font-medium shrink-0">
            {((Number(d.total) / total) * 100).toFixed(0)}%
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ExpenseStatsTab({ permissions }) {
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState({ daily_limit: "", anomaly_threshold: "", notify_unpaid: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await expensesApi.stats();
      setData(res.data);
      if (res.data.settings) setSettings(res.data.settings);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await expensesApi.updateSettings({
        daily_limit: settings.daily_limit || null,
        anomaly_threshold: settings.anomaly_threshold || null,
        notify_unpaid: settings.notify_unpaid,
      });
      load();
    } catch (e) {
      alert("Parametrlər saxlanılmadı");
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return <p className="text-slate-500 text-sm p-4">Yüklənir...</p>;
  }

  const cards = data.cards || {};

  return (
    <Box className="space-y-4">
      {data.alerts?.length > 0 && (
        <Box className="space-y-2">
          {data.alerts.map((a, i) => (
            <Box key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {a.message}
            </Box>
          ))}
        </Box>
      )}

      <Box className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Bugün", value: cards.today },
          { label: "Həftə", value: cards.week },
          { label: "Ay", value: cards.month },
          { label: "Ümumi", value: cards.total },
        ].map((c) => (
          <Box key={c.label} className="rounded-xl border bg-white p-3 shadow-sm">
            <p className="text-[10px] uppercase text-slate-400 font-semibold">{c.label}</p>
            <p className="text-lg font-bold text-slate-800">{Number(c.value || 0).toFixed(2)} ₼</p>
          </Box>
        ))}
        <Box className="rounded-xl border bg-indigo-50 p-3 col-span-2 lg:col-span-1">
          <p className="text-[10px] uppercase text-indigo-600 font-semibold">Top kateqoriya</p>
          <p className="text-sm font-bold text-indigo-900 truncate">
            {cards.top_category?.name || "—"}
          </p>
          <p className="text-xs text-indigo-700">
            {Number(cards.top_category?.total || 0).toFixed(2)} ₼
          </p>
        </Box>
      </Box>

      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Box className="rounded-xl border bg-white p-4">
          <h4 className="text-sm font-semibold mb-3">Günlük xərc (14 gün)</h4>
          <BarChart data={data.daily_chart || []} labelKey="date" valueKey="total" />
        </Box>
        <Box className="rounded-xl border bg-white p-4">
          <h4 className="text-sm font-semibold mb-3">Aylıq müqayisə</h4>
          <BarChart data={data.monthly_chart || []} labelKey="month" valueKey="total" />
        </Box>
      </Box>

      <Box className="rounded-xl border bg-white p-4">
        <h4 className="text-sm font-semibold mb-3">Kateqoriya üzrə paylanma</h4>
        <PieLegend data={data.category_pie || []} />
      </Box>

      {permissions.manageCategories && (
        <Box className="rounded-xl border bg-slate-50 p-4">
          <h4 className="text-sm font-semibold mb-3">Bildiriş limitləri</h4>
          <Box className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-sm">
              Günlük limit (₼)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border py-2 px-2"
                value={settings.daily_limit ?? ""}
                onChange={(e) => setSettings((s) => ({ ...s, daily_limit: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              Anormal xərc həddi (₼)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border py-2 px-2"
                value={settings.anomaly_threshold ?? ""}
                onChange={(e) => setSettings((s) => ({ ...s, anomaly_threshold: e.target.value }))}
              />
            </label>
            <label className="text-sm flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                checked={!!settings.notify_unpaid}
                onChange={(e) => setSettings((s) => ({ ...s, notify_unpaid: e.target.checked }))}
              />
              Ödənilməmiş xəbərdarlığı
            </label>
          </Box>
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white font-semibold">
            Saxla
          </button>
        </Box>
      )}
    </Box>
  );
}
