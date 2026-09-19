import React from "react";

const TONES = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/30",
  warning: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/30",
  danger:  "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-400/30",
  info:    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-400/30",
  neutral: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10",
  purple:  "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-400/30",
};

export default function Badge({ tone = "neutral", size = "sm", icon: Icon, children, className = "", ...rest }) {
  const sizes = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]";
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full font-medium border",
        sizes,
        TONES[tone] || TONES.neutral,
        className,
      ].join(" ")}
      {...rest}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}
