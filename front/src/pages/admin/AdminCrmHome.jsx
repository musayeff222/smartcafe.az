import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  Bell,
  Boxes,
  Wallet,
  Database,
  Activity,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { adminGet, friendlyError } from "./adminApi";
import Card from "./ui/Card";
import Skeleton from "./ui/Skeleton";
import Badge from "./ui/Badge";
import { daysUntil, healthOf } from "./restaurants/health";

const cards = [
  { key: "restaurants_total", label: "Restoranlar", icon: Building2, to: "/adminPage/dashboard" },
  { key: "restaurants_active", label: "Aktiv restoran", icon: Activity, to: "/adminPage/dashboard" },
  { key: "users_total", label: "İstifadəçilər", icon: Users, to: "/adminPage/dashboard" },
  { key: "packages_total", label: "Paketlər", icon: Boxes, to: "/adminPage/packages" },
  { key: "notifications_total", label: "Bildirişlər", icon: Bell, to: "/adminPage/notifications" },
];

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString("az-AZ", { maximumFractionDigits: 2 });
}

function AdminCrmHome() {
  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [audit, setAudit] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminGet("/admin/crm/stats"),
      adminGet("/admin-restaurants").catch(() => ({ data: [] })),
      adminGet("/admin/audit-logs").catch(() => ({ data: [] })),
    ])
      .then(([s, r, a]) => {
        setStats(s.data);
        setRestaurants(Array.isArray(r.data) ? r.data : []);
        setAudit(Array.isArray(a.data) ? a.data.slice(0, 10) : []);
      })
      .catch((e) => setErr(friendlyError(e, "Statistika yüklənmədi")))
      .finally(() => setLoading(false));
  }, []);

  const expiring = useMemo(
    () =>
      restaurants
        .map((r) => ({ ...r, days: daysUntil(r.active_until) }))
        .filter((r) => r.days !== null && r.days >= 0 && r.days <= 30)
        .sort((a, b) => a.days - b.days)
        .slice(0, 8),
    [restaurants]
  );

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">CRM Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">smartcafe.az ümumi vəziyyət</p>
      </div>
      {err && <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 px-4 py-3 text-sm">{err}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.key} to={c.to}>
              <Card className="hover:border-indigo-200 dark:hover:border-indigo-500/40 transition h-full">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500 dark:text-slate-400">{c.label}</div>
                  <Icon size={18} className="text-indigo-600" />
                </div>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{stats?.[c.key] ?? 0}</div>
              </Card>
            </Link>
          );
        })}
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">Bu ay ödəniş</div>
            <Wallet size={18} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{money(stats?.payments_month)}</div>
          <div className="text-xs text-slate-400 mt-1">Bu gün: {money(stats?.payments_today)}</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 mb-3">
            <AlertTriangle size={18} className="text-amber-500" />
            Yaxınlaşan bitmə (30 gün)
          </div>
          {expiring.length ? (
            <ul className="space-y-2">
              {expiring.map((r) => {
                const h = healthOf(r);
                return (
                  <li key={r.id}>
                    <Link
                      to={`/adminPage/restaurants/${r.id}`}
                      className="flex items-center justify-between gap-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg px-2 py-1.5 -mx-2"
                    >
                      <span className="truncate font-medium text-slate-800 dark:text-slate-100">{r.name}</span>
                      <Badge tone={h.tone}>{h.label}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">30 gün ərzində bitən restoran yoxdur.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 mb-3">
            <Activity size={18} className="text-indigo-600" />
            Son fəaliyyət
          </div>
          {audit.length ? (
            <ul className="space-y-2">
              {audit.map((a) => (
                <li key={a.id} className="text-sm">
                  <div className="font-medium text-slate-800 dark:text-slate-100 truncate">{a.action}</div>
                  <div className="text-xs text-slate-400">
                    {a.restaurant_name || ""} · {a.created_at ? String(a.created_at).replace("T", " ").slice(0, 16) : ""}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Qeyd yoxdur.</p>
          )}
          <Link to="/adminPage/audit" className="inline-flex items-center gap-1 text-sm text-indigo-600 mt-3">
            Jurnal <ArrowRight size={14} />
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 mb-3">
            <Database size={18} className="text-indigo-600" />
            Backup statusu
          </div>
          {stats?.backup ? (
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <div>Status: <b>{stats.backup.status}</b></div>
              <div>Ad: {stats.backup.name}</div>
              <div>Vaxt: {String(stats.backup.finished_at || "").replace("T", " ").slice(0, 19) || "-"}</div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Hələ backup yoxdur.</p>
          )}
          <Link to="/adminPage/backups" className="inline-flex items-center gap-1 text-sm text-indigo-600 mt-3">
            Backup idarəetməsi <ArrowRight size={14} />
          </Link>
        </Card>
        <Card>
          <div className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Sistem</div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
            <div>Layihə: {stats?.system?.app}</div>
            <div>Mühit: {stats?.system?.env}</div>
            <div>Telegram: {stats?.system?.telegram ? "qoşulub" : "qoşulmayıb"}</div>
            <div>Yeni restoran (7 gün): {stats?.restaurants_new_7d ?? 0}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminCrmHome;
