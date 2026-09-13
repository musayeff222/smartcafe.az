import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import MiniSparkline from "./MiniSparkline";
import { cardClass, mutedText } from "./dashboardTheme";

const Box = "div";

export default function StatCard({ title, value, suffix = "₼", icon: Icon, card, isDark, format = "money" }) {
  const isCount = format === "count";
  const c = card || {};
  const trend = c.trend;
  const display = isCount
    ? String(Math.round(value ?? c.value ?? 0))
    : `${Number(value ?? c.value ?? 0).toFixed(2)} ${suffix}`.trim();

  const up = trend?.direction === "up";
  const spark = c.sparkline || [];

  return (
    <Box
      className={`${cardClass(isDark)} p-4 transition hover:scale-[1.01] hover:shadow-md`}
      style={{ animation: "fadeIn 0.4s ease" }}>
      <Box className="flex items-start justify-between gap-2">
        <Box className="min-w-0">
          <p className={`text-[10px] font-semibold uppercase tracking-wide ${mutedText(isDark)}`}>
            {title}
          </p>
          <p className="text-lg sm:text-xl font-bold mt-1 truncate">{display}</p>
          {trend && (
            <p
              className={`text-xs font-medium mt-1 flex items-center gap-0.5 ${
                up ? "text-emerald-500" : "text-rose-500"
              }`}>
              {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend.percent)}% · dünən {Number(trend.previous_value).toFixed(0)}
              {format === "money" ? " ₼" : ""}
            </p>
          )}
        </Box>
        <Box className="flex flex-col items-end gap-1">
          {Icon && (
            <span
              className={`p-2 rounded-xl ${
                isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-600"
              }`}>
              <Icon size={18} />
            </span>
          )}
          <MiniSparkline data={spark} color={up ? "#10b981" : "#f43f5e"} />
        </Box>
      </Box>
    </Box>
  );
}
