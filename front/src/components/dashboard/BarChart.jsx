import React from "react";
import { mutedText } from "./dashboardTheme";

const Box = "div";

export default function BarChart({ data = [], labelKey = "label", valueKey = "value", isDark, height = 120 }) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  return (
    <Box className="flex items-end gap-1" style={{ height: height + 24 }}>
      {data.map((d, i) => (
        <Box key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <Box
            className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500"
            style={{ height: `${(Number(d[valueKey]) / max) * height}px` }}
            title={`${d[labelKey]}: ${d[valueKey]}`}
          />
          <span className={`text-[9px] truncate w-full text-center ${mutedText(isDark)}`}>
            {String(d[labelKey]).slice(-5)}
          </span>
        </Box>
      ))}
    </Box>
  );
}
