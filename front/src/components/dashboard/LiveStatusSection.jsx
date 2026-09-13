import React from "react";
import { Link } from "react-router-dom";
import { cardClass, mutedText } from "./dashboardTheme";

const Box = "div";

const STATUS_STYLE = {
  active: "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
  empty: "bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700",
  awaiting_bill: "bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-400",
  reserved: "bg-blue-500/15 border-blue-500/40 text-blue-600",
};

const STATUS_LABEL = {
  active: "Dolu",
  empty: "Boş",
  awaiting_bill: "Hesab gözləyir",
  reserved: "Rezerv",
};

export default function LiveStatusSection({ live, delivery, isDark }) {
  if (!live) return null;
  const summary = [
    { label: "Aktiv", value: live.active, color: "text-emerald-500" },
    { label: "Boş", value: live.empty, color: "text-slate-400" },
    { label: "Hesab gözləyir", value: live.awaiting_bill, color: "text-amber-500" },
    { label: "QR gözləyir", value: live.pending_qr, color: "text-indigo-500" },
    { label: "Çatdırılma", value: delivery?.in_delivery ?? 0, color: "text-violet-500" },
    { label: "Hazır (sifariş)", value: delivery?.ready ?? 0, color: "text-cyan-500" },
  ];

  const busyTables = (live.tables || []).filter((t) => t.status !== "empty").slice(0, 24);

  return (
    <Box className={`${cardClass(isDark)} p-4`}>
      <Box className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold">Canlı restoran statusu</h3>
        <span className={`text-xs ${mutedText(isDark)}`}>Yenilənir · 45s</span>
      </Box>
      <Box className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        {summary.map((s) => (
          <Box
            key={s.label}
            className={`rounded-xl p-2 text-center ${isDark ? "bg-slate-800/80" : "bg-slate-50"}`}>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className={`text-[10px] ${mutedText(isDark)}`}>{s.label}</p>
          </Box>
        ))}
      </Box>
      <Box className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-72 overflow-y-auto">
        {busyTables.length === 0 ? (
          <p className={`col-span-full text-sm py-6 text-center ${mutedText(isDark)}`}>
            Hazırda dolu masa yoxdur
          </p>
        ) : (
          busyTables.map((t) => (
            <Link
              key={t.id}
              to={`/masa-siparis/${t.id}`}
              className={`rounded-xl border p-3 transition hover:scale-[1.02] ${STATUS_STYLE[t.status] || STATUS_STYLE.active}`}>
              <p className="font-bold text-sm">{t.name}</p>
              <p className="text-xs opacity-80">{STATUS_LABEL[t.status] || t.status}</p>
              <p className="text-sm font-semibold mt-1">{Number(t.total).toFixed(2)} ₼</p>
              <p className="text-[10px] opacity-70">{t.elapsed_minutes} dəq</p>
            </Link>
          ))
        )}
      </Box>
    </Box>
  );
}
