import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { base_url, domain_url } from "../api/index";
import {
  Loader2,
  RefreshCw,
  Link2,
  CheckCircle2,
  XCircle,
  Unlink,
  ExternalLink,
  Filter,
} from "lucide-react";

function authHeaders() {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  };
}

const STATUS_FILTERS = [
  { id: "all", label: "Hamısı" },
  { id: "pending", label: "Gözləyən" },
  { id: "active", label: "Aktiv" },
  { id: "rejected", label: "Rədd edilmiş" },
];

const statusBadge = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  none: "bg-slate-100 text-slate-600",
};

const statusLabel = {
  pending: "Gözləyir",
  active: "Aktiv",
  rejected: "Rədd edilib",
  none: "Yoxdur",
};

export default function WebDomainAdminPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState("");
  const [rejectId, setRejectId] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await axios.get(`${base_url}/admin/web-domains`, {
        ...authHeaders(),
        params: filter !== "all" ? { status: filter } : {},
      });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Domain siyahısı yüklənmədi.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (id, action, adminNote) => {
    setBusyId(id);
    setErr("");
    try {
      await axios.patch(
        `${base_url}/admin/web-domains/${id}`,
        { action, admin_note: adminNote || null },
        authHeaders()
      );
      setRejectId(null);
      setRejectNote("");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Əməliyyat alınmadı.");
    } finally {
      setBusyId(null);
    }
  };

  const hints = rows[0]?.dns_hints;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Link2 size={20} className="text-indigo-600" />
            Web menyu domainləri
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Restoranlar öz domainini Web Ayarlarından daxil edir. DNS qeydlərini yoxladıqdan sonra buradan
            aktiv edin və ya bağlayın.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shrink-0"
        >
          <RefreshCw size={16} />
          Yenilə
        </button>
      </div>

      {hints && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs text-slate-700 space-y-1">
          <p className="font-semibold text-slate-800">DNS (restoranlara deyin)</p>
          <p>
            <strong>CNAME:</strong> subdomain → <code className="bg-white px-1 rounded">{hints.cname_target}</code>
          </p>
          <p>
            <strong>A qeydi:</strong> server IP → <code className="bg-white px-1 rounded">{hints.server_ip}</code>
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-slate-400" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              filter === f.id
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {err && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{err}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="animate-spin mr-2" size={20} />
          Yüklənir...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-sm text-slate-500">
          {filter === "pending" ? "Gözləyən domain sorğusu yoxdur." : "Domain qeydi tapılmadı."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Restoran</th>
                <th className="px-4 py-3 font-semibold">Domain</th>
                <th className="px-4 py-3 font-semibold">Slug / link</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Qeyd</th>
                <th className="px-4 py-3 font-semibold text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const busy = busyId === row.id;
                const menuUrl = `${domain_url}/menu/${row.slug}`;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{row.restaurant_name || "—"}</div>
                      {row.restaurant_phone && (
                        <div className="text-xs text-slate-500">{row.restaurant_phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://${row.custom_domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                      >
                        {row.custom_domain}
                        <ExternalLink size={12} />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={menuUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:underline text-xs"
                      >
                        /menu/{row.slug}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                          statusBadge[row.domain_status] || statusBadge.none
                        }`}
                      >
                        {statusLabel[row.domain_status] || row.domain_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-xs text-slate-600 truncate" title={row.domain_note || ""}>
                        {row.domain_note || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {row.domain_status !== "active" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => runAction(row.id, "activate")}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            Aktiv et
                          </button>
                        )}
                        {row.domain_status === "active" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              if (window.confirm(`${row.custom_domain} domainini bağlamaq istəyirsiniz?`)) {
                                runAction(row.id, "disconnect");
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-600 text-white text-xs font-medium hover:bg-slate-700 disabled:opacity-50"
                          >
                            {busy ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
                            Bağla
                          </button>
                        )}
                        {row.domain_status === "pending" && (
                          <>
                            {rejectId === row.id ? (
                              <div className="flex flex-col gap-1 w-full min-w-[180px]">
                                <input
                                  className="text-xs border rounded px-2 py-1"
                                  placeholder="Rədd səbəbi (ixtiyari)"
                                  value={rejectNote}
                                  onChange={(e) => setRejectNote(e.target.value)}
                                />
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => runAction(row.id, "reject", rejectNote)}
                                    className="flex-1 px-2 py-1 rounded bg-red-600 text-white text-xs"
                                  >
                                    Təsdiq
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectId(null);
                                      setRejectNote("");
                                    }}
                                    className="px-2 py-1 rounded border text-xs"
                                  >
                                    Ləğv
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setRejectId(row.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
                              >
                                <XCircle size={12} />
                                Rədd et
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
