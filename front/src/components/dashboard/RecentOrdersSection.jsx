import React from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { cardClass, mutedText } from "./dashboardTheme";

const Box = "div";

const STATUS_CLASS = {
  preparing: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  served: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  completed: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  waiting: "bg-yellow-100 text-yellow-800",
};

const STATUS_LABEL = {
  preparing: "Hazırlanır",
  ready: "Hazırdır",
  served: "Servis edildi",
  completed: "Bağlanıb",
  cancelled: "Ləğv",
  waiting: "Gözləyir",
};

export default function RecentOrdersSection({ orders = [], isDark }) {
  return (
    <Box className={`${cardClass(isDark)} p-4 overflow-hidden`}>
      <h3 className="text-sm font-bold mb-3">Son sifarişlər</h3>
      <Box className="overflow-x-auto -mx-1">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className={`text-left text-[10px] uppercase ${mutedText(isDark)} border-b border-slate-200 dark:border-slate-700`}>
              <th className="py-2 pr-2">ID</th>
              <th className="py-2 pr-2">Masa</th>
              <th className="py-2 pr-2">Məbləğ</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Tarix</th>
              <th className="py-2"> </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className={`py-8 text-center ${mutedText(isDark)}`}>
                  Sifariş yoxdur
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.payment_id || o.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2.5 pr-2 font-mono text-xs">#{o.id}</td>
                  <td className="py-2.5 pr-2">{o.table_name}</td>
                  <td className="py-2.5 pr-2 font-semibold">{Number(o.amount).toFixed(2)} ₼</td>
                  <td className="py-2.5 pr-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[o.status] || STATUS_CLASS.completed}`}>
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                  </td>
                  <td className={`py-2.5 pr-2 text-xs ${mutedText(isDark)}`}>
                    {o.datetime ? new Date(o.datetime).toLocaleString("az-AZ") : "—"}
                  </td>
                  <td className="py-2.5">
                    <Link
                      to="/gunluk-kasa"
                      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                      <Eye size={14} /> Bax
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}
