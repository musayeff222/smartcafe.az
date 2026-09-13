import React from "react";
import { Calendar, Filter } from "lucide-react";
import { cardClass, mutedText } from "./dashboardTheme";

const Box = "div";

const FILTERS = [
  { id: "today", label: "Bugün" },
  { id: "yesterday", label: "Dünən" },
  { id: "week", label: "Bu həftə" },
  { id: "month", label: "Bu ay" },
  { id: "custom", label: "Tarix aralığı" },
];

export default function DashboardFilters({ filter, setFilter, customFrom, setCustomFrom, customTo, setCustomTo, onApply, isDark }) {
  return (
    <Box className={`${cardClass(isDark)} p-3 flex flex-wrap items-center gap-2`}>
      <Filter size={16} className={mutedText(isDark)} />
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => setFilter(f.id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            filter === f.id
              ? "bg-indigo-600 text-white shadow"
              : isDark
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}>
          {f.label}
        </button>
      ))}
      {filter === "custom" && (
        <Box className="flex flex-wrap items-center gap-2 ml-1">
          <Calendar size={14} className={mutedText(isDark)} />
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className={`rounded-lg border px-2 py-1 text-sm ${isDark ? "bg-slate-800 border-slate-700" : "border-slate-200"}`}
          />
          <span className={mutedText(isDark)}>—</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className={`rounded-lg border px-2 py-1 text-sm ${isDark ? "bg-slate-800 border-slate-700" : "border-slate-200"}`}
          />
          <button
            type="button"
            onClick={onApply}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium">
            Tətbiq et
          </button>
        </Box>
      )}
    </Box>
  );
}
