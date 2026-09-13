export function dashboardShell(isDark) {
  return isDark
    ? "min-h-screen bg-slate-950 text-slate-100"
    : "min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 text-slate-900";
}

export function cardClass(isDark) {
  return isDark
    ? "rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-black/20"
    : "rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm";
}

export function mutedText(isDark) {
  return isDark ? "text-slate-400" : "text-slate-500";
}
