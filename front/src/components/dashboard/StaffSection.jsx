import React from "react";
import { cardClass, mutedText } from "./dashboardTheme";
import { Award, UserCheck, Wallet } from "lucide-react";

const Box = "div";

export default function StaffSection({ staff, isDark }) {
  if (!staff) return null;
  const cards = [
    { label: "Top kassir", data: staff.top_cashier, icon: Wallet, field: "orders", suffix: " sifariş" },
    { label: "Ən aktiv", data: staff.top_waiter, icon: UserCheck, field: "orders", suffix: " sifariş" },
    { label: "Ən çox satış", data: staff.top_sales, icon: Award, field: "revenue", suffix: " ₼" },
  ];

  return (
    <Box className={`${cardClass(isDark)} p-4`}>
      <h3 className="text-sm font-bold mb-3">İşçi performansı</h3>
      <Box className="grid sm:grid-cols-3 gap-3 mb-4">
        {cards.map(({ label, data, icon: Icon, field, suffix }) => (
          <Box
            key={label}
            className={`rounded-xl p-3 ${isDark ? "bg-slate-800/80" : "bg-gradient-to-br from-indigo-50 to-violet-50"}`}>
            <Icon size={18} className="text-indigo-500 mb-2" />
            <p className={`text-[10px] uppercase font-semibold ${mutedText(isDark)}`}>{label}</p>
            <p className="font-bold mt-1">{data?.name || "—"}</p>
            <p className="text-sm text-indigo-600 dark:text-indigo-400">
              {data ? `${data[field]}${suffix}` : "—"}
            </p>
          </Box>
        ))}
      </Box>
      {staff.list?.length > 0 && (
        <ul className={`text-sm space-y-1 ${mutedText(isDark)}`}>
          {staff.list.slice(0, 5).map((u) => (
            <li key={u.user_id} className="flex justify-between">
              <span>{u.name}</span>
              <span>
                {u.orders} sif. · {Number(u.revenue).toFixed(0)} ₼
              </span>
            </li>
          ))}
        </ul>
      )}
    </Box>
  );
}
