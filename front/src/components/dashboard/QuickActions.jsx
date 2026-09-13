import React from "react";
import { Link } from "react-router-dom";
import { Banknote, LayoutGrid, Package, PlusCircle, Receipt, BarChart3 } from "lucide-react";
import { cardClass, mutedText } from "./dashboardTheme";

const Box = "div";

const ACTIONS = [
  { to: "/siparisler", label: "Yeni sifariş", icon: Receipt, color: "indigo" },
  { to: "/masalar", label: "Masa aç", icon: LayoutGrid, color: "violet" },
  { to: "/expenses", label: "Xərc əlavə", icon: Banknote, color: "rose" },
  { to: "/stok", label: "Məhsul / stok", icon: Package, color: "emerald" },
  { to: "/gunluk-kasa", label: "Hesabat", icon: BarChart3, color: "amber" },
];

export default function QuickActions({ isDark }) {
  return (
    <Box className={`${cardClass(isDark)} p-4`}>
      <h3 className="text-sm font-bold mb-3">Sürətli əməliyyatlar</h3>
      <Box className="flex flex-wrap gap-2">
        {ACTIONS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition hover:scale-105 ${
              isDark
                ? "bg-slate-800 hover:bg-indigo-600/30 text-slate-200"
                : "bg-slate-50 hover:bg-indigo-50 text-slate-800 border border-slate-100"
            }`}>
            <Icon size={16} className="text-indigo-500" />
            {label}
          </Link>
        ))}
        <Link
          to="/stok"
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
            isDark ? "bg-slate-800 text-slate-200" : "bg-indigo-600 text-white"
          }`}>
          <PlusCircle size={16} />
          Stok əlavə
        </Link>
      </Box>
      <p className={`text-xs mt-2 ${mutedText(isDark)}`}>Filial filtri hazırda aktiv deyil (tək restoran).</p>
    </Box>
  );
}
