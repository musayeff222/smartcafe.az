import React, { useState } from "react";
import { Bell, X, Send, ArrowRightCircle, CalendarClock, FileSpreadsheet } from "lucide-react";
import Button from "../ui/Button";

const EXTENDS = [
  { days: 30, label: "+30 gün" },
  { days: 90, label: "+90 gün" },
  { days: 180, label: "+180 gün" },
  { days: 365, label: "+365 gün" },
];

export default function RestaurantBulkBar({
  count,
  onClear,
  onExtend,
  onActivate,
  onDeactivate,
  onNotify,
  onExport,
  loading,
}) {
  const [extendOpen, setExtendOpen] = useState(false);
  if (!count) return null;
  return (
    <div className="sticky top-16 z-20">
      <div className="bg-slate-900 text-white rounded-2xl shadow-admin-lg border border-slate-800 dark:border-slate-700 px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 pr-2 border-r border-white/10 mr-1">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold">
            {count}
          </span>
          <span className="text-sm">seçildi</span>
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setExtendOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
          >
            <CalendarClock size={14} /> Müddəti uzat
          </button>
          {extendOpen && (
            <div className="absolute left-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-30">
              {EXTENDS.map((e) => (
                <button
                  key={e.days}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
                  onClick={() => {
                    setExtendOpen(false);
                    onExtend?.(e.days);
                  }}
                >
                  {e.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onActivate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/25 text-emerald-100 text-sm disabled:opacity-60"
        >
          <ArrowRightCircle size={14} /> Aktivləşdir
        </button>
        <button
          type="button"
          onClick={onDeactivate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/25 text-rose-100 text-sm disabled:opacity-60"
        >
          <X size={14} /> Deaktiv et
        </button>
        <button
          type="button"
          onClick={onNotify}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
        >
          <Send size={14} /> Bildiriş göndər
        </button>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
        >
          <FileSpreadsheet size={14} /> Excel export
        </button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onClear} className="!text-white hover:!bg-white/10">
          Ləğv
        </Button>
      </div>
    </div>
  );
}
