import React from "react";
import BarChart from "./BarChart";
import PieLegend from "./PieLegend";
import { cardClass, mutedText } from "./dashboardTheme";

const Box = "div";

export default function ChartsSection({ charts, isDark }) {
  if (!charts) return null;

  return (
    <Box className="grid lg:grid-cols-2 gap-4">
      <Box className={`${cardClass(isDark)} p-4`}>
        <h3 className="text-sm font-bold mb-2">Günlük satış (14 gün)</h3>
        <BarChart data={charts.daily_sales || []} isDark={isDark} />
      </Box>
      <Box className={`${cardClass(isDark)} p-4`}>
        <h3 className="text-sm font-bold mb-2">Həftəlik müqayisə</h3>
        <BarChart data={charts.weekly_comparison || []} isDark={isDark} />
      </Box>
      <Box className={`${cardClass(isDark)} p-4`}>
        <h3 className="text-sm font-bold mb-2">Aylıq gəlir</h3>
        <BarChart data={charts.monthly_revenue || []} isDark={isDark} height={100} />
      </Box>
      <Box className={`${cardClass(isDark)} p-4`}>
        <h3 className="text-sm font-bold mb-2">Saatlara görə sıxlıq</h3>
        <BarChart data={charts.hourly_orders || []} isDark={isDark} height={90} />
      </Box>
      <Box className={`${cardClass(isDark)} p-4 lg:col-span-2`}>
        <h3 className="text-sm font-bold mb-2">Kateqoriya üzrə satış</h3>
        <Box className="grid md:grid-cols-2 gap-4">
          <PieLegend data={charts.category_sales || []} isDark={isDark} />
          <ul className={`text-sm space-y-1 ${mutedText(isDark)}`}>
            {(charts.category_sales || []).map((c, i) => (
              <li key={i} className="flex justify-between">
                <span>{c.name}</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {Number(c.total).toFixed(2)} ₼
                </span>
              </li>
            ))}
          </ul>
        </Box>
      </Box>
    </Box>
  );
}
