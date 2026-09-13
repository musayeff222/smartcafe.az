import React from "react";
import { cardClass } from "./dashboardTheme";

export default function DashboardSkeleton({ isDark }) {
  const pulse = "animate-pulse bg-slate-300/40 dark:bg-slate-700/50 rounded-lg";
  const card = cardClass(isDark);

  return (
    <div className="space-y-6 p-3 sm:p-4 max-w-[1600px] mx-auto">
      <div className={`${card} p-4 h-20 ${pulse}`} />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`${card} p-4 h-28 ${pulse}`} />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className={`${card} h-64 ${pulse}`} />
        <div className={`${card} h-64 ${pulse}`} />
      </div>
    </div>
  );
}
