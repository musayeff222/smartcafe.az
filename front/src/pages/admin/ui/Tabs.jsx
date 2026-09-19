import React from "react";

export default function Tabs({ tabs, active, onChange, className = "" }) {
  return (
    <div
      role="tablist"
      className={[
        "flex flex-wrap gap-1 border-b border-slate-200 dark:border-[#1f2a44]",
        className,
      ].join(" ")}
    >
      {tabs.map((t) => {
        const on = t.id === active;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange?.(t.id)}
            className={[
              "-mb-px inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition",
              on
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
            ].join(" ")}
          >
            {Icon && <Icon size={14} />}
            {t.label}
            {t.badge != null && (
              <span className="ml-1 rounded-full bg-slate-100 dark:bg-white/10 text-[10px] px-1.5 py-0.5">
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
