import React from "react";
import { mutedText } from "./dashboardTheme";

const Box = "div";
const COLORS = ["#4f46e5", "#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export default function PieLegend({ data = [], isDark }) {
  const total = data.reduce((s, d) => s + Number(d.total || d.value) || 0, 0) || 1;
  return (
    <ul className="space-y-2">
      {data.map((d, i) => (
        <li key={i} className="flex justify-between gap-2 text-sm">
          <span className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            {d.name}
          </span>
          <span className={`font-semibold shrink-0 ${mutedText(isDark)}`}>
            {((Number(d.total || d.value) / total) * 100).toFixed(0)}%
          </span>
        </li>
      ))}
    </ul>
  );
}
