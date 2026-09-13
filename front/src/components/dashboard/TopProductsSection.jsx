import React from "react";
import { img_url } from "../../api/index";
import { cardClass, mutedText } from "./dashboardTheme";

const Box = "div";

export default function TopProductsSection({ products = [], isDark }) {
  return (
    <Box className={`${cardClass(isDark)} p-4`}>
      <h3 className="text-sm font-bold mb-3">Ən çox satılan məhsullar</h3>
      {products.length === 0 ? (
        <p className={`text-sm py-6 text-center ${mutedText(isDark)}`}>Məlumat yoxdur</p>
      ) : (
        <ul className="space-y-3">
          {products.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-indigo-500 w-5">{i + 1}</span>
              <img
                src={p.image ? `${img_url}/${p.image}` : "/logo192.png"}
                alt=""
                className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                onError={(e) => {
                  e.target.src = "/logo192.png";
                }}
              />
              <Box className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className={`text-xs ${mutedText(isDark)}`}>{p.quantity} satış</p>
              </Box>
              <Box className="text-right">
                <p className="font-bold text-sm">{Number(p.revenue).toFixed(2)} ₼</p>
              </Box>
            </li>
          ))}
        </ul>
      )}
    </Box>
  );
}
