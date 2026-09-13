import React from "react";
import { AlertTriangle, Bell, Info } from "lucide-react";
import { cardClass, mutedText } from "./dashboardTheme";

const Box = "div";

const ICON = {
  warning: AlertTriangle,
  info: Info,
  error: AlertTriangle,
};

export default function AlertsSection({ alerts = [], isDark }) {
  return (
    <Box className={`${cardClass(isDark)} p-4`}>
      <Box className="flex items-center gap-2 mb-3">
        <Bell size={16} className="text-indigo-500" />
        <h3 className="text-sm font-bold">Bildirişlər</h3>
      </Box>
      {alerts.length === 0 ? (
        <p className={`text-sm py-4 text-center ${mutedText(isDark)}`}>Xəbərdarlıq yoxdur</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.map((a, i) => {
            const Icon = ICON[a.severity] || Info;
            return (
              <li
                key={i}
                className={`flex gap-2 p-2.5 rounded-xl text-sm ${
                  a.severity === "warning"
                    ? isDark
                      ? "bg-amber-900/20 border border-amber-800/40"
                      : "bg-amber-50 border border-amber-100"
                    : isDark
                      ? "bg-slate-800 border border-slate-700"
                      : "bg-slate-50 border border-slate-100"
                }`}>
                <Icon size={16} className="shrink-0 mt-0.5 text-amber-500" />
                <Box>
                  <p className="font-semibold">{a.title}</p>
                  <p className={`text-xs ${mutedText(isDark)}`}>{a.message}</p>
                </Box>
              </li>
            );
          })}
        </ul>
      )}
    </Box>
  );
}
