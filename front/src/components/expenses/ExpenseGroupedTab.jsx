import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CalendarDays, Calendar } from "lucide-react";
import { expensesApi } from "../../api/expensesApi";
import { paymentLabel } from "./constants";

const MONTH_NAMES = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "İyun",
  "İyul",
  "Avqust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

function formatDayLabel(key) {
  const d = new Date(`${key}T12:00:00`);
  return d.toLocaleDateString("az-AZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonthLabel(key) {
  const [y, m] = key.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

function ExpenseRows({ items }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-400 py-3 px-2">Bu dövrdə xərc yoxdur</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase text-slate-400 border-b">
            <th className="py-2 text-left font-semibold">Ad</th>
            <th className="py-2 text-left font-semibold">Kateqoriya</th>
            <th className="py-2 text-right font-semibold">Məbləğ</th>
            <th className="py-2 text-left font-semibold">Ödəniş</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/80">
              <td className="py-2 pr-2 font-medium text-slate-800">{row.name}</td>
              <td className="py-2 pr-2 text-slate-600">{row.category?.name || "—"}</td>
              <td className="py-2 text-right font-semibold text-red-600">
                {Number(row.amount).toFixed(2)} ₼
              </td>
              <td className="py-2 text-slate-500">{paymentLabel(row.payment_method)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ExpenseGroupedTab() {
  const now = new Date();
  const [period, setPeriod] = useState("day");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openKeys, setOpenKeys] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expensesApi.grouped({ period, year, month });
      setData(res.data);
      const withExpenses = (res.data.groups || [])
        .filter((g) => g.count > 0)
        .reduce((acc, g) => ({ ...acc, [g.key]: true }), {});
      setOpenKeys(withExpenses);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const shiftMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    setMonth(m);
    setYear(y);
  };

  const shiftYear = (delta) => setYear((y) => y + delta);

  const toggle = (key) => setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }));

  const groups = data?.groups || [];
  const groupsWithExpense = groups.filter((g) => g.count > 0);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setPeriod("day")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
            period === "day" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
          }`}>
          <CalendarDays size={16} />
          Günlük
        </button>
        <button
          type="button"
          onClick={() => setPeriod("month")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
            period === "month" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
          }`}>
          <Calendar size={16} />
          Aylıq
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (period === "day" ? shiftMonth(-1) : shiftYear(-1))}
            className="p-2 rounded-lg border bg-white hover:bg-slate-100">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-slate-800 min-w-[140px] text-center">
            {period === "day"
              ? `${MONTH_NAMES[month - 1]} ${year}`
              : `${year} ili`}
          </span>
          <button
            type="button"
            onClick={() => (period === "day" ? shiftMonth(1) : shiftYear(1))}
            className="p-2 rounded-lg border bg-white hover:bg-slate-100">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase text-slate-400 font-semibold">
            {period === "day" ? "Ay üzrə cəm" : "İl üzrə cəm"}
          </p>
          <p className="text-xl font-bold text-indigo-700">
            {Number(data?.grand_total || 0).toFixed(2)} ₼
          </p>
          <p className="text-xs text-slate-500">
            {groupsWithExpense.length}{" "}
            {period === "day" ? "gün" : "ay"} xərc var
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-500 py-8">Yüklənir...</p>
      ) : (
        <div className="space-y-2 max-h-[min(70vh,600px)] overflow-y-auto pr-1">
          {groups.map((group) => {
            const isOpen = !!openKeys[group.key];
            const hasItems = group.count > 0;
            const label =
              period === "day" ? formatDayLabel(group.key) : formatMonthLabel(group.key);

            return (
              <div
                key={group.key}
                className={`rounded-xl border overflow-hidden ${
                  hasItems ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50/50"
                }`}>
                <button
                  type="button"
                  onClick={() => toggle(group.key)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition">
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        hasItems ? "text-slate-800" : "text-slate-400"
                      }`}>
                      {label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {group.count} xərc
                      {!hasItems && " · boş"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-base font-bold ${
                        hasItems ? "text-red-600" : "text-slate-300"
                      }`}>
                      {Number(group.total).toFixed(2)} ₼
                    </span>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400" />
                    )}
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 px-2 pb-2 bg-slate-50/30">
                    <ExpenseRows items={group.items} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

