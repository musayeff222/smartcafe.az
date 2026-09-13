import React from "react";
import { Link } from "react-router-dom";
import BarChart from "./BarChart";
import { cardClass, mutedText } from "./dashboardTheme";

const Box = "div";

export default function FinanceSection({ finance, isDark }) {
  if (!finance) return null;
  const chartData = (finance.income_vs_expense || []).map((d) => ({
    label: d.label,
    value: d.income,
  }));

  return (
    <Box className={`${cardClass(isDark)} p-4`}>
      <Box className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">Xərclər və maliyyə</h3>
        <Link to="/expenses" className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
          Xərclər →
        </Link>
      </Box>
      <Box className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Box className={`rounded-xl p-3 ${isDark ? "bg-slate-800" : "bg-emerald-50"}`}>
          <p className={`text-[10px] uppercase ${mutedText(isDark)}`}>Bugün gəlir</p>
          <p className="text-lg font-bold text-emerald-600">{Number(finance.today_revenue).toFixed(2)} ₼</p>
        </Box>
        <Box className={`rounded-xl p-3 ${isDark ? "bg-slate-800" : "bg-rose-50"}`}>
          <p className={`text-[10px] uppercase ${mutedText(isDark)}`}>Bugün xərc</p>
          <p className="text-lg font-bold text-rose-600">{Number(finance.today_expense).toFixed(2)} ₼</p>
        </Box>
        <Box className={`rounded-xl p-3 ${isDark ? "bg-slate-800" : "bg-indigo-50"}`}>
          <p className={`text-[10px] uppercase ${mutedText(isDark)}`}>Gün profit</p>
          <p className="text-lg font-bold text-indigo-600">{Number(finance.profit_today).toFixed(2)} ₼</p>
        </Box>
        <Box className={`rounded-xl p-3 ${isDark ? "bg-slate-800" : "bg-violet-50"}`}>
          <p className={`text-[10px] uppercase ${mutedText(isDark)}`}>Ay profit</p>
          <p className="text-lg font-bold text-violet-600">{Number(finance.profit_month).toFixed(2)} ₼</p>
        </Box>
      </Box>
      <p className={`text-xs mb-2 ${mutedText(isDark)}`}>Gəlir (son 14 gün)</p>
      <BarChart data={chartData} isDark={isDark} height={90} />
    </Box>
  );
}
