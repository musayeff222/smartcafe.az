import React, { useEffect, useState } from "react";
import axios from "axios";
import { base_url } from "../../api/index";
import { ScrollText } from "lucide-react";

function AdminAudit() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    axios
      .get(`${base_url}/admin/audit-logs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          Accept: "application/json",
        },
      })
      .then((r) => setRows(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErr("Jurnal yüklənmədi"));
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
        <ScrollText size={22} className="text-indigo-600" />
        Əməliyyat jurnalı
      </h2>
      {err && <p className="text-sm text-rose-600 mb-3">{err}</p>}
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl border border-slate-200 dark:border-[#1f2a44] overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">Vaxt</th>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Əməliyyat</th>
              <th className="px-3 py-2 text-left">Hədəf</th>
              <th className="px-3 py-2 text-left">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-slate-500">
                  Qeyd yoxdur
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                  {r.created_at
                    ? String(r.created_at).slice(0, 19).replace("T", " ")
                    : "-"}
                </td>
                <td className="px-3 py-2 text-slate-500">{r.user_id || "-"}</td>
                <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">
                  {r.action}
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                  {r.restaurant_name || r.restaurant_id || r.meta?.id || "-"}
                </td>
                <td className="px-3 py-2 text-slate-500">{r.ip || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminAudit;
