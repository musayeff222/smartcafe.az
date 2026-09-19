import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  Building2,
  Plus,
  Download,
  Upload,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  FileText,
  FileJson,
  FileDown,
  Database,
  Loader2,
  LogIn,
} from "lucide-react";
import { adminGet, adminPost, adminPut, adminDelete, friendlyError } from "../adminApi";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import Skeleton from "../ui/Skeleton";
import Card from "../ui/Card";
import ConfirmDialog from "../ui/ConfirmDialog";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Copy from "../ui/Copy";
import Table from "../ui/Table";
import RestaurantFilters from "./RestaurantFilters";
import RestaurantBulkBar from "./RestaurantBulkBar";
import RestaurantRowActions from "./RestaurantRowActions";
import AddUserModal from "../../../components/AddUserModal";
import EditUserModal from "../../../components/EditUserModal";
import { base_url } from "../../../api/index";
import { healthOf, daysUntil, formatMoney } from "./health";
import { startAdminImpersonation } from "../../../utils/adminImpersonation";

const LS = {
  density: "sc_admin_restaurants_density",
  status: "sc_admin_restaurants_status",
  sort: "sc_admin_restaurants_sort",
  cols: "sc_admin_restaurants_cols_v2",
};

const ALL_COLUMNS = [
  { key: "restaurant", label: "Restoran", sortable: true, always: true },
  { key: "admin", label: "Admin" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status", sortable: true },
  { key: "health", label: "Sağlamlıq", sortable: true },
  { key: "active_until", label: "Müddət", sortable: true },
  { key: "id", label: "ID", sortable: true },
];

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export default function RestaurantsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(() => localStorage.getItem(LS.status) || "all");
  const [density, setDensity] = useState(() => localStorage.getItem(LS.density) || "comfortable");
  const [sort, setSort] = useState(() => loadJson(LS.sort, { key: "restaurant", dir: "asc" }));
  const [visibleColumns, setVisibleColumns] = useState(() =>
    loadJson(LS.cols, ["restaurant", "admin", "status", "health", "active_until"])
  );
  const [selected, setSelected] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [resetRow, setResetRow] = useState(null);
  const [resetPw, setResetPw] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [bulkNotifyOpen, setBulkNotifyOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [enteringId, setEnteringId] = useState(null);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyBody, setNotifyBody] = useState("");
  const [notifySaving, setNotifySaving] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);
  const exportRef = useRef(null);

  // Persist local prefs
  useEffect(() => { localStorage.setItem(LS.density, density); }, [density]);
  useEffect(() => { localStorage.setItem(LS.status, status); }, [status]);
  useEffect(() => { localStorage.setItem(LS.sort, JSON.stringify(sort)); }, [sort]);
  useEffect(() => { localStorage.setItem(LS.cols, JSON.stringify(visibleColumns)); }, [visibleColumns]);

  useEffect(() => {
    const h = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") setShowAdd(true);
  }, [searchParams]);

  const fetchRestaurants = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await adminGet("/admin-restaurants");
      setRestaurants(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error(friendlyError(e, "Restoran siyahısı yüklənmədi"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const stats = useMemo(() => {
    const total = restaurants.length;
    const active = restaurants.filter((r) => r.is_active).length;
    const expiring = restaurants.filter((r) => {
      const d = daysUntil(r.active_until);
      return d !== null && d >= 0 && d <= 14;
    }).length;
    const expired = restaurants.filter((r) => {
      const d = daysUntil(r.active_until);
      return d !== null && d < 0;
    }).length;
    return { total, active, expiring, expired };
  }, [restaurants]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return restaurants.filter((r) => {
      const admin = r.users?.[0];
      const matches =
        !q ||
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        admin?.name?.toLowerCase().includes(q) ||
        admin?.email?.toLowerCase().includes(q) ||
        String(r.id).includes(q);
      if (!matches) return false;
      const days = daysUntil(r.active_until);
      switch (status) {
        case "active":
          return r.is_active && (days === null || days >= 0);
        case "inactive":
          return !r.is_active;
        case "expiring":
          return days !== null && days >= 0 && days <= 14;
        case "expired":
          return days !== null && days < 0;
        default:
          return true;
      }
    });
  }, [restaurants, search, status]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const key = sort?.key || "restaurant";
    const dir = sort?.dir === "desc" ? -1 : 1;
    list.sort((a, b) => {
      let av, bv;
      switch (key) {
        case "restaurant":
          av = a.name || ""; bv = b.name || ""; break;
        case "status":
          av = a.is_active ? 1 : 0; bv = b.is_active ? 1 : 0; break;
        case "health":
          av = healthOf(a).order; bv = healthOf(b).order; break;
        case "active_until":
          av = a.active_until ? new Date(a.active_until).getTime() : Number.POSITIVE_INFINITY;
          bv = b.active_until ? new Date(b.active_until).getTime() : Number.POSITIVE_INFINITY;
          break;
        case "id":
          av = a.id; bv = b.id; break;
        default:
          av = a[key] || ""; bv = b[key] || "";
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return list;
  }, [filtered, sort]);

  const allSelected = selected.length > 0 && sorted.every((r) => selected.includes(r.id));

  const handleAdd = async (payload) => {
    try {
      await adminPost("/admin-restaurants", payload);
      toast.success("Restoran əlavə edildi");
      setShowAdd(false);
      fetchRestaurants(true);
    } catch (e) {
      toast.error(friendlyError(e, "Restoran əlavə edilə bilmədi"));
    }
  };

  const handleEdit = async (payload) => {
    try {
      await adminPut(`/admin-restaurants/${payload.id}`, payload);
      toast.success("Yeniləndi");
      setShowEdit(false);
      setEditRow(null);
      fetchRestaurants(true);
    } catch (e) {
      toast.error(friendlyError(e, "Yenilənmədi"));
    }
  };

  const doDelete = async ({ password }) => {
    try {
      await adminDelete(`/admin-restaurants/${deleteRow.id}`, { password }, {
        "X-Confirm-Delete": "DELETE",
        "X-Confirm-Password": password,
      });
      setRestaurants((prev) => prev.filter((r) => r.id !== deleteRow.id));
      setDeleteRow(null);
      toast.success("Silindi");
    } catch (e) {
      toast.error(friendlyError(e, "Silinmədi"));
    }
  };

  const doStatusToggle = async (r) => {
    try {
      const payload = {
        id: r.id,
        name: r.name,
        admin_name: r.users?.[0]?.name || "",
        admin_email: r.email,
        is_active: !r.is_active,
        active_until: r.active_until ? r.active_until.slice(0, 10) : null,
      };
      await adminPut(`/admin-restaurants/${r.id}`, payload);
      setRestaurants((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active: !x.is_active } : x)));
    } catch (e) {
      toast.error(friendlyError(e, "Status dəyişilmədi"));
    }
  };

  const enterRestaurant = async (r) => {
    setEnteringId(r.id);
    try {
      const res = await adminPost(`/admin-restaurants/${r.id}/access-token`, {});
      const token = res.data.access_token;
      if (!token) throw new Error("Token alınmadı");
      localStorage.setItem("token", token);
      localStorage.setItem("role", res.data.role || "admin");
      startAdminImpersonation({
        restaurantId: r.id,
        restaurantName: r.name,
      });
      window.location.assign("/masalar");
    } catch (e) {
      toast.error(friendlyError(e, "Restorana girilmədi. Admin istifadəçi varmı?"));
    } finally {
      setEnteringId(null);
    }
  };

  const doAccessToken = async (r) => {
    try {
      const res = await adminPost(`/admin-restaurants/${r.id}/access-token`, {});
      const token = res.data.access_token;
      await navigator.clipboard.writeText(token || "");
      toast.success("Access token panoya kopyalandı (8 saat)");
    } catch (e) {
      toast.error(friendlyError(e, "Token alınmadı"));
    }
  };

  const doResetPassword = async () => {
    if (!resetPw || resetPw.length < 6) {
      toast.error("Yeni şifrə ən az 6 simvol olmalıdır");
      return;
    }
    if (!resetConfirm) {
      toast.error("Super-admin şifrəsi tələb olunur");
      return;
    }
    setResetBusy(true);
    try {
      await adminPost(`/admin/restaurants/${resetRow.id}/reset-password`, {
        password: resetPw,
        confirm_password: resetConfirm,
      });
      toast.success("Şifrə sıfırlandı");
      setResetRow(null);
      setResetPw("");
      setResetConfirm("");
    } catch (e) {
      toast.error(friendlyError(e, "Şifrə sıfırlanmadı"));
    } finally {
      setResetBusy(false);
    }
  };

  const runBulk = async (action, extraPayload = {}) => {
    if (!selected.length) return;
    setBulkLoading(true);
    try {
      await adminPost("/admin/restaurants/bulk", {
        restaurant_ids: selected,
        action,
        ...extraPayload,
      });
      toast.success("Toplu əməliyyat tamamlandı");
      setSelected([]);
      fetchRestaurants(true);
    } catch (e) {
      toast.error(friendlyError(e, "Əməliyyat alınmadı"));
    } finally {
      setBulkLoading(false);
    }
  };

  const bulkNotify = async () => {
    if (!selected.length) return;
    setNotifySaving(true);
    try {
      await adminPost("/admin/notifications", {
        title: notifyTitle,
        body: notifyBody,
        broadcast: false,
        restaurant_ids: selected,
        type: "info",
        priority: "normal",
      });
      toast.success("Bildiriş göndərildi");
      setBulkNotifyOpen(false);
      setNotifyTitle("");
      setNotifyBody("");
    } catch (e) {
      toast.error(friendlyError(e, "Bildiriş göndərilmədi"));
    } finally {
      setNotifySaving(false);
    }
  };

  const exportSelectedExcel = () => {
    const rows = (selected.length ? sorted.filter((r) => selected.includes(r.id)) : sorted).map((r) => ({
      id: r.id,
      name: r.name,
      admin_name: r.users?.[0]?.name || "",
      admin_email: r.email,
      is_active: r.is_active ? 1 : 0,
      active_until: r.active_until ? r.active_until.slice(0, 10) : "",
      health: healthOf(r).label,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Restoranlar");
    XLSX.writeFile(wb, `restoranlar_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setExportOpen(false);
  };

  const exportCsv = () => {
    const rows = sorted.map((r) => ({
      id: r.id,
      name: r.name,
      admin_email: r.email,
      is_active: r.is_active ? 1 : 0,
      active_until: r.active_until ? r.active_until.slice(0, 10) : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `restoranlar_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setExportOpen(false);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(sorted, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `restoranlar_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setExportOpen(false);
  };

  const importFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const readAs = (kind) =>
      new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onerror = () => reject(new Error("Faylı oxumaq alınmadı"));
        fr.onload = (ev) => resolve(ev.target.result);
        if (kind === "text") fr.readAsText(file); else fr.readAsArrayBuffer(file);
      });
    let rows = [];
    try {
      if (/\.json$/i.test(file.name)) {
        const t = await readAs("text");
        const parsed = JSON.parse(t);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const b = await readAs("bin");
        const wb = XLSX.read(b, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      }
      let success = 0, fail = 0;
      const errors = [];
      for (const [i, row] of rows.entries()) {
        const payload = {
          name: row.name || row.restoran || "",
          admin_name: row.admin_name || row.adminName || "",
          admin_email: row.admin_email || row.email || "",
          admin_password: row.admin_password || row.password || "123456",
          is_active: !!(row.is_active === 1 || row.is_active === "1" || row.is_active === true || String(row.is_active).toLowerCase() === "true"),
          active_until: row.active_until || null,
        };
        if (!payload.name || !payload.admin_email) {
          fail++; errors.push(`Sətir ${i + 1}: name/email boşdur`); continue;
        }
        try {
          await adminPost("/admin-restaurants", payload);
          success++;
        } catch (err) {
          fail++;
          errors.push(`Sətir ${i + 1}: ${friendlyError(err, "xəta")}`);
        }
      }
      setImportResult({ success, fail, errors });
      fetchRestaurants(true);
    } catch (err) {
      setImportResult({ success: 0, fail: 0, errors: [`Fayl oxunarkən xəta: ${err.message}`] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const columnDefs = useMemo(() => {
    const shown = new Set(visibleColumns);
    return ALL_COLUMNS.map((c) => ({
      ...c,
      hidden: !c.always && !shown.has(c.key),
    })).map((c) => {
      switch (c.key) {
        case "restaurant":
          return {
            ...c,
            render: (r) => (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold grid place-items-center uppercase text-sm">
                  {r.name?.[0] || "?"}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">{r.name}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    #{r.id}
                    <Copy value={r.id} size={10} title="ID kopyala" />
                  </div>
                </div>
              </div>
            ),
          };
        case "admin":
          return {
            ...c,
            render: (r) => (
              <div className="min-w-0">
                <div className="text-slate-700 dark:text-slate-200 truncate">{r.users?.[0]?.name || "-"}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[16rem]">
                  {r.users?.[0]?.email || r.email || ""}
                </div>
              </div>
            ),
          };
        case "email":
          return {
            ...c,
            render: (r) => (
              <div className="flex items-center gap-1 min-w-0">
                <span className="truncate text-slate-600 dark:text-slate-300">{r.email}</span>
                {r.email && <Copy value={r.email} />}
              </div>
            ),
          };
        case "status":
          return {
            ...c,
            render: (r) => (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); doStatusToggle(r); }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  r.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
                aria-label="Status"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    r.is_active ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            ),
          };
        case "health":
          return {
            ...c,
            render: (r) => {
              const h = healthOf(r);
              return <Badge tone={h.tone}>{h.label}</Badge>;
            },
          };
        case "active_until":
          return {
            ...c,
            render: (r) => (
              <span className="text-slate-600 dark:text-slate-300 text-xs">
                {r.active_until ? r.active_until.slice(0, 10) : "—"}
              </span>
            ),
          };
        case "id":
          return { ...c, render: (r) => <span className="text-slate-500 text-xs">#{r.id}</span> };
        default:
          return c;
      }
    });
  }, [visibleColumns]);

  const columns = useMemo(
    () => [
      ...columnDefs,
      {
        key: "actions",
        label: "",
        align: "right",
        render: (r) => (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="secondary"
              icon={enteringId === r.id ? Loader2 : LogIn}
              onClick={() => enterRestaurant(r)}
              title="Restorana gir"
            />
            <RestaurantRowActions
              restaurant={r}
              onOpen={(x) => navigate(`/adminPage/restaurants/${x.id}`)}
              onEnter={enterRestaurant}
              onNotify={(x) => navigate(`/adminPage/notifications?restaurant=${x.id}`)}
              onEdit={(x) => { setEditRow(x); setShowEdit(true); }}
              onResetPassword={(x) => { setResetRow(x); setResetPw(""); setResetConfirm(""); }}
              onDelete={(x) => setDeleteRow(x)}
              onCopyId={(x) => { navigator.clipboard.writeText(String(x.id)); toast.success("ID kopyalandı"); }}
              onAccessToken={doAccessToken}
            />
          </div>
        ),
      },
    ],
    [columnDefs, enteringId, navigate]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Restoranlar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {stats.total} restoran · {stats.active} aktiv · {stats.expiring} bitmək üzrə · {stats.expired} vaxtı keçib
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div ref={exportRef} className="relative">
            <Button variant="secondary" size="md" icon={Download} onClick={() => setExportOpen((v) => !v)}>
              Export
            </Button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-[#1f2a44] shadow-admin-lg z-30 py-1">
                <MenuRow icon={FileSpreadsheet} label="Excel (.xlsx)" onClick={exportSelectedExcel} />
                <MenuRow icon={FileText} label="CSV (.csv)" onClick={exportCsv} />
                <MenuRow icon={FileJson} label="JSON (.json)" onClick={exportJson} />
                <div className="my-1 border-t border-slate-100 dark:border-[#1f2a44]" />
                <MenuRow icon={FileDown} label="Import şablonu" onClick={() => {
                  const sample = [{
                    name: "Nümunə", admin_name: "Admin", admin_email: "admin@example.com",
                    admin_password: "123456", is_active: 1, active_until: "2027-12-31",
                  }];
                  const ws = XLSX.utils.json_to_sheet(sample);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Şablon");
                  XLSX.writeFile(wb, "restoran_import_sablonu.xlsx");
                  setExportOpen(false);
                }} />
              </div>
            )}
          </div>
          <label
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border cursor-pointer transition ${
              importing
                ? "bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-[#1f2a44] cursor-not-allowed"
                : "bg-white dark:bg-[#111a2e] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#1f2a44] hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            <span>{importing ? "Yüklənir…" : "Import"}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={importFile}
              disabled={importing}
              className="hidden"
            />
          </label>
          <Button variant="primary" size="md" icon={Plus} onClick={() => setShowAdd(true)}>
            Yeni restoran
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Users size={18} />} label="Ümumi" value={stats.total} tone="indigo" />
        <StatCard icon={<CheckCircle2 size={18} />} label="Aktiv" value={stats.active} tone="emerald" />
        <StatCard icon={<AlertTriangle size={18} />} label="Bitmək üzrə" value={stats.expiring} tone="amber" />
        <StatCard icon={<XCircle size={18} />} label="Vaxtı keçib" value={stats.expired} tone="rose" />
      </div>

      <RestaurantFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        onRefresh={() => fetchRestaurants(true)}
        density={density}
        onDensity={setDensity}
        columns={ALL_COLUMNS.filter((c) => !c.always)}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
      />

      <RestaurantBulkBar
        count={selected.length}
        onClear={() => setSelected([])}
        onExtend={(days) => runBulk("extend", { extend_days: days })}
        onActivate={() => runBulk("activate")}
        onDeactivate={() => runBulk("deactivate")}
        onNotify={() => setBulkNotifyOpen(true)}
        onExport={exportSelectedExcel}
        loading={bulkLoading}
      />

      {importResult && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${
          importResult.fail === 0 && importResult.success > 0
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-400/30 dark:text-emerald-200"
            : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-400/30 dark:text-amber-200"
        }`}>
          <div className="font-semibold">
            Import: {importResult.success} uğurlu, {importResult.fail} xətalı
          </div>
          {importResult.errors.length > 0 && (
            <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs">
              {importResult.errors.slice(0, 6).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {importResult.errors.length > 6 && <li>… {importResult.errors.length - 6} daha</li>}
            </ul>
          )}
          <button onClick={() => setImportResult(null)} className="mt-2 text-xs underline">Bağla</button>
        </div>
      )}

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={search || status !== "all" ? "Nəticə tapılmadı" : "Hələ restoran yoxdur"}
            description={search || status !== "all" ? "Axtarış və filtrləri dəyişməyi cəhd edin." : "İlk restoranı əlavə etməklə başlayın."}
            cta={!search && status === "all" ? "Yeni restoran" : null}
            onCta={() => setShowAdd(true)}
          />
        ) : (
          <>
            <Table
              columns={columns}
              rows={sorted}
              getRowKey={(r) => r.id}
              sort={sort}
              onSort={setSort}
              density={density}
              onRowClick={(r) => navigate(`/adminPage/restaurants/${r.id}`)}
              selection={selected}
              onSelectionChange={setSelected}
              allSelected={allSelected}
              onSelectAll={(v) => setSelected(v ? sorted.map((r) => r.id) : [])}
            />
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-[#1f2a44] text-xs text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-white/[0.02]">
              {sorted.length} / {restaurants.length} göstərilir
              {refreshing && <span className="ml-2">· yenilənir…</span>}
            </div>
          </>
        )}
      </Card>

      {showAdd && (
        <AddUserModal onAddUser={handleAdd} onClose={() => setShowAdd(false)} />
      )}
      {showEdit && editRow && (
        <EditUserModal
          user={editRow}
          onEditUser={handleEdit}
          onClose={() => { setShowEdit(false); setEditRow(null); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={doDelete}
        variant="danger"
        title={`${deleteRow?.name || "Restoran"} silinsin?`}
        description="Bu əməliyyat geri qaytarıla bilməz. Bütün istifadəçi hesabları da silinəcək."
        confirmText="Sil"
        requirePassword
      />

      <Modal
        open={!!resetRow}
        onClose={() => setResetRow(null)}
        title={`${resetRow?.name || ""} — admin şifrəsini sıfırla`}
        description="Yeni şifrəni təyin edin. Restoran adminin bütün sessiyaları bağlanacaq."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setResetRow(null)}>Ləğv</Button>
            <Button variant="primary" onClick={doResetPassword} loading={resetBusy}>Sıfırla</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            type="password"
            value={resetPw}
            onChange={(e) => setResetPw(e.target.value)}
            label="Yeni şifrə"
            placeholder="Ən az 6 simvol"
            autoFocus
          />
          <Input
            type="password"
            value={resetConfirm}
            onChange={(e) => setResetConfirm(e.target.value)}
            label="Sizin super-admin şifrəniz"
          />
        </div>
      </Modal>

      <Modal
        open={bulkNotifyOpen}
        onClose={() => setBulkNotifyOpen(false)}
        title={`Bildiriş göndər (${selected.length} restoran)`}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBulkNotifyOpen(false)}>Ləğv</Button>
            <Button variant="primary" onClick={bulkNotify} loading={notifySaving}>Göndər</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Başlıq"
            value={notifyTitle}
            onChange={(e) => setNotifyTitle(e.target.value)}
            placeholder="Məsələn: Zəhmət olmasa müddət uzadın"
          />
          <label className="block text-sm">
            <span className="block mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Mətn
            </span>
            <textarea
              rows={4}
              value={notifyBody}
              onChange={(e) => setNotifyBody(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f1830] border border-slate-200 dark:border-[#1f2a44] rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Bildiriş mətni"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ icon, label, value, tone = "indigo" }) {
  const map = {
    indigo: "from-indigo-500 to-blue-600",
    emerald: "from-emerald-500 to-green-600",
    amber: "from-amber-500 to-orange-600",
    rose: "from-rose-500 to-red-600",
  };
  return (
    <Card padding="md" className="flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${map[tone]} text-white grid place-items-center shrink-0 shadow`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">{label}</div>
        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
      </div>
    </Card>
  );
}

function MenuRow({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
    >
      <Icon size={14} className="text-slate-500" />
      <span>{label}</span>
    </button>
  );
}
