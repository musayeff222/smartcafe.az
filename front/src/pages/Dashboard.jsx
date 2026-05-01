import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  pageTitle,
  APP_NAME,
  BACKUP_FORMAT_ID,
  BACKUP_FILENAME_PREFIX,
} from "../config/branding";
import { useNavigate } from "react-router-dom";
import AddUserModal from "../components/AddUserModal";
import EditUserModal from "../components/EditUserModal";
import DeleteUserModal from "../components/DeleteUserModal";
import axios from "axios";
import { base_url } from "../api/index";
import { Helmet } from "react-helmet";
import * as XLSX from "xlsx";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Download,
  Upload,
  LogOut,
  Pencil,
  Trash2,
  Menu,
  X,
  FileSpreadsheet,
  FileJson,
  FileText,
  RefreshCw,
  FileDown,
  Database,
  Loader2,
  ShieldCheck,
} from "lucide-react";

const STATUS_FILTERS = [
  { id: "all", label: "Hamısı" },
  { id: "active", label: "Aktiv" },
  { id: "expiring", label: "Bitmək üzrə" },
  { id: "inactive", label: "Deaktiv" },
];

function Dashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [backupRunning, setBackupRunning] = useState(false);
  const [backupLog, setBackupLog] = useState([]);
  const [backupProgress, setBackupProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/404");
    } else {
      fetchRestaurants();
    }
  }, [navigate]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const authHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
    },
  });

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${base_url}/admin-restaurants`,
        authHeaders()
      );
      setRestaurants(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch restaurants", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async (newRestaurant) => {
    try {
      await axios.post(
        `${base_url}/admin-restaurants`,
        newRestaurant,
        authHeaders()
      );
      fetchRestaurants();
      setShowAddUserModal(false);
    } catch (error) {
      if (error.response) {
        const errorMessage =
          error.response.data.error || error.response.data.message;
        if (errorMessage && errorMessage.includes("Email already exists")) {
          alert("Bu emailda istifadəçi mövcuddur");
        } else {
          console.error("Failed to add restaurant:", errorMessage);
        }
      } else {
        console.error("Failed to add restaurant:", error);
      }
    }
  };

  const handleEditRestaurant = async (updatedRestaurant) => {
    try {
      await axios.put(
        `${base_url}/admin-restaurants/${updatedRestaurant.id}`,
        updatedRestaurant,
        authHeaders()
      );
      fetchRestaurants();
      setShowEditUserModal(false);
    } catch (error) {
      console.error("Failed to update restaurant", error);
    }
  };

  const handleDeleteRestaurant = async (id) => {
    try {
      await axios.delete(`${base_url}/admin-restaurants/${id}`, authHeaders());
      setRestaurants(restaurants.filter((r) => r.id !== id));
      setShowDeleteUserModal(false);
    } catch (error) {
      console.error("Failed to delete restaurant", error);
    }
  };

  const handleStatusToggle = async (restaurant) => {
    try {
      const payload = {
        id: restaurant.id,
        name: restaurant.name,
        admin_name: restaurant.users?.[0]?.name || "",
        admin_email: restaurant.email,
        is_active: !restaurant.is_active,
        active_until: restaurant.active_until
          ? restaurant.active_until.slice(0, 10)
          : null,
      };
      await axios.put(
        `${base_url}/admin-restaurants/${restaurant.id}`,
        payload,
        authHeaders()
      );
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === restaurant.id ? { ...r, is_active: !r.is_active } : r
        )
      );
    } catch (error) {
      console.error("Status update failed", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/adminPage");
  };

  const makeAuthHeader = (which = "admin") => {
    const token =
      which === "admin"
        ? localStorage.getItem("admin_token")
        : localStorage.getItem("token");
    if (!token) return null;
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
  };

  const tryFetch = async (url, log) => {
    const attempts = [
      { which: "admin", label: "admin" },
      { which: "user", label: "restoran" },
    ];
    for (const a of attempts) {
      const h = makeAuthHeader(a.which);
      if (!h) continue;
      try {
        const res = await axios.get(`${base_url}${url}`, h);
        log?.(`✓ ${url} (${a.label} token)`);
        return { ok: true, data: res.data, via: a.label };
      } catch (err) {
        const status = err?.response?.status || "?";
        if (status === 401 || status === 403) {
          continue;
        }
        log?.(`✗ ${url} — HTTP ${status}`);
        return { ok: false, error: err?.message, status };
      }
    }
    log?.(`✗ ${url} — icazəsiz`);
    return { ok: false, error: "unauthorized", status: 401 };
  };

  const handleFullBackup = async () => {
    setBackupRunning(true);
    setBackupLog([]);
    const log = (msg) => setBackupLog((prev) => [...prev, msg]);

    const endpoints = [
      { key: "admin_restaurants", url: "/admin-restaurants" },
      { key: "own_restaurant", url: "/own-restaurants" },
      { key: "current_user", url: "/me" },
      { key: "tables", url: "/tables" },
      { key: "table_groups", url: "/table-groups" },
      { key: "stocks", url: "/stocks" },
      { key: "stock_groups", url: "/stock-groups" },
      { key: "stock_sets", url: "/stock-sets" },
      { key: "stock_all", url: "/stock-all" },
      { key: "customers", url: "/customers" },
      { key: "personal", url: "/personal" },
      { key: "couriers", url: "/couriers" },
      { key: "raw_materials", url: "/raw-materials" },
      { key: "time_presets", url: "/time-presets" },
      { key: "quick_orders", url: "/quick-orders" },
    ];

    setBackupProgress({ current: 0, total: endpoints.length });

    const backup = {
      meta: {
        format: BACKUP_FORMAT_ID,
        version: "1.0",
        exported_at: new Date().toISOString(),
        source_url: window.location.origin,
        api_url: base_url,
        notes:
          "Bu faylda restoran sisteminin snapshot-ı saxlanılır. Başqa restoran sistemində bərpa etmək üçün AI_MIGRATION_PROMPT.txt sənədinə baxın.",
      },
      schema: {
        admin_restaurants: "Super admin-in gördüyü restoran siyahısı",
        own_restaurant: "Cari istifadəçinin restoran ayarları",
        current_user: "Backup-ı alan istifadəçi",
        tables: "Masalar",
        table_groups: "Masa qrupları",
        stocks: "Məhsullar (menyu)",
        stock_groups: "Məhsul kateqoriyaları",
        stock_sets: "Set menyular",
        stock_all: "Bütün stok məlumatı",
        customers: "Müştərilər",
        personal: "İşçilər",
        couriers: "Kuryerlər",
        raw_materials: "Xammal",
        time_presets: "Zaman paketləri (PS Club)",
        quick_orders: "Sürətli sifarişlər",
      },
      data: {},
      errors: {},
    };

    for (let i = 0; i < endpoints.length; i++) {
      const ep = endpoints[i];
      setBackupProgress({ current: i + 1, total: endpoints.length });
      log(`→ ${ep.url} ...`);
      const result = await tryFetch(ep.url, log);
      if (result.ok) {
        backup.data[ep.key] = result.data;
      } else {
        backup.errors[ep.key] = {
          status: result.status,
          message: result.error,
        };
      }
    }

    const itemCount = Object.values(backup.data).reduce((acc, v) => {
      if (Array.isArray(v)) return acc + v.length;
      if (v && typeof v === "object") return acc + 1;
      return acc;
    }, 0);

    backup.meta.total_items = itemCount;

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const time = new Date().toISOString().slice(11, 16).replace(":", "");
    triggerDownload(blob, `${BACKUP_FILENAME_PREFIX}_${date}_${time}.json`);

    log(`✅ Tamamlandı — ${itemCount} qeyd, ${Object.keys(backup.errors).length} xəta`);
    setBackupRunning(false);
  };

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const stats = useMemo(() => {
    const total = restaurants.length;
    const active = restaurants.filter((r) => r.is_active).length;
    const inactive = total - active;
    const expiring = restaurants.filter((r) => {
      const d = daysUntil(r.active_until);
      return d !== null && d >= 0 && d <= 7;
    }).length;
    return { total, active, inactive, expiring };
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return restaurants.filter((r) => {
      const matchesSearch =
        !q ||
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.users?.[0]?.name?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === "active") return r.is_active;
      if (statusFilter === "inactive") return !r.is_active;
      if (statusFilter === "expiring") {
        const d = daysUntil(r.active_until);
        return d !== null && d >= 0 && d <= 7;
      }
      return true;
    });
  }, [restaurants, search, statusFilter]);

  const buildExportRows = () =>
    filteredRestaurants.map((r) => ({
      id: r.id,
      name: r.name,
      admin_name: r.users?.[0]?.name || "",
      admin_email: r.email,
      is_active: r.is_active ? 1 : 0,
      active_until: r.active_until ? r.active_until.slice(0, 10) : "",
    }));

  const exportToExcel = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Restoranlar");
    XLSX.writeFile(wb, `restoranlar_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setExportMenuOpen(false);
  };

  const exportToCSV = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, `restoranlar_${new Date().toISOString().slice(0, 10)}.csv`);
    setExportMenuOpen(false);
  };

  const exportToJSON = () => {
    const rows = buildExportRows();
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: "application/json",
    });
    triggerDownload(blob, `restoranlar_${new Date().toISOString().slice(0, 10)}.json`);
    setExportMenuOpen(false);
  };

  const downloadTemplate = () => {
    const sample = [
      {
        name: "Nümunə Restoran",
        admin_name: "Admin Adı",
        admin_email: "admin@example.com",
        admin_password: "123456",
        is_active: 1,
        active_until: "2026-12-31",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Şablon");
    XLSX.writeFile(wb, "restoran_import_sablonu.xlsx");
    setExportMenuOpen(false);
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseImportFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Faylı oxumaq alınmadı"));
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          if (file.name.toLowerCase().endsWith(".json")) {
            const parsed = JSON.parse(data);
            resolve(Array.isArray(parsed) ? parsed : [parsed]);
          } else {
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            resolve(XLSX.utils.sheet_to_json(sheet, { defval: "" }));
          }
        } catch (err) {
          reject(err);
        }
      };
      if (file.name.toLowerCase().endsWith(".json")) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    let success = 0;
    let fail = 0;
    const errors = [];

    try {
      const rows = await parseImportFile(file);

      for (const [idx, row] of rows.entries()) {
        try {
          const payload = {
            name: row.name || row.restoran || "",
            admin_name: row.admin_name || row.adminName || "",
            admin_email: row.admin_email || row.email || "",
            admin_password: row.admin_password || row.password || "123456",
            is_active:
              row.is_active === 1 ||
              row.is_active === "1" ||
              row.is_active === true ||
              String(row.is_active).toLowerCase() === "true",
            active_until: row.active_until || null,
          };

          if (!payload.name || !payload.admin_email) {
            throw new Error("name və ya admin_email boşdur");
          }

          await axios.post(
            `${base_url}/admin-restaurants`,
            payload,
            authHeaders()
          );
          success++;
        } catch (err) {
          fail++;
          const msg =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message;
          errors.push(`Sətir ${idx + 1}: ${msg}`);
        }
      }

      setImportResult({ success, fail, errors });
      fetchRestaurants();
    } catch (err) {
      setImportResult({
        success: 0,
        fail: 0,
        errors: [`Fayl oxunarkən xəta: ${err.message}`],
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getExpiryBadge = (dateStr) => {
    const d = daysUntil(dateStr);
    if (d === null) return null;
    if (d < 0)
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
          Vaxtı keçib
        </span>
      );
    if (d <= 7)
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
          {d} gün qalıb
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
        {d} gün qalıb
      </span>
    );
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle('İdarə Paneli')}</title>
        <meta
          name="description"
          content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi"
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
                aria-label="Menyu"
              >
                <Menu size={22} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white font-bold shadow-md">
                  {APP_NAME.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-slate-800 leading-tight">
                    {APP_NAME}
                  </h1>
                  <p className="text-[11px] text-slate-500 -mt-0.5">
                    Super Admin Panel
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchRestaurants}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
                title="Yenilə"
              >
                <RefreshCw size={16} />
                <span className="hidden md:inline">Yenilə</span>
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Çıxış</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={<Users size={20} />}
              label="Ümumi restoran"
              value={stats.total}
              color="from-indigo-500 to-blue-600"
            />
            <StatCard
              icon={<CheckCircle2 size={20} />}
              label="Aktiv"
              value={stats.active}
              color="from-emerald-500 to-green-600"
            />
            <StatCard
              icon={<AlertTriangle size={20} />}
              label="Bitmək üzrə"
              value={stats.expiring}
              color="from-amber-500 to-orange-600"
            />
            <StatCard
              icon={<XCircle size={20} />}
              label="Deaktiv"
              value={stats.inactive}
              color="from-rose-500 to-red-600"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Restoran, admin və ya email axtar..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="flex overflow-x-auto -mx-1 px-1 gap-1.5 lg:mx-0 lg:px-0">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                      statusFilter === f.id
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setExportMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    <Download size={16} />
                    <span>Export</span>
                  </button>
                  {exportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20">
                      <MenuItem
                        icon={<FileSpreadsheet size={16} />}
                        label="Excel (.xlsx)"
                        onClick={exportToExcel}
                      />
                      <MenuItem
                        icon={<FileText size={16} />}
                        label="CSV (.csv)"
                        onClick={exportToCSV}
                      />
                      <MenuItem
                        icon={<FileJson size={16} />}
                        label="JSON (.json)"
                        onClick={exportToJSON}
                      />
                      <div className="my-1 border-t border-slate-100" />
                      <MenuItem
                        icon={<FileDown size={16} />}
                        label="Import şablonu yüklə"
                        onClick={downloadTemplate}
                      />
                    </div>
                  )}
                </div>

                <label
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
                    importing
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Upload size={16} />
                  <span>{importing ? "Yüklənir..." : "Import"}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.json"
                    onChange={handleImport}
                    disabled={importing}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setBackupOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                  title="Tam sistem backup"
                >
                  <Database size={16} />
                  <span className="hidden sm:inline">Backup</span>
                </button>

                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-md transition"
                >
                  <Plus size={16} />
                  <span>Yeni</span>
                </button>
              </div>
            </div>

            {importResult && (
              <div
                className={`mt-4 p-3 rounded-xl text-sm border ${
                  importResult.fail === 0 && importResult.success > 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}
              >
                <div className="font-semibold">
                  Import nəticəsi: {importResult.success} uğurlu, {importResult.fail} xətalı
                </div>
                {importResult.errors.length > 0 && (
                  <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>... və daha {importResult.errors.length - 5} xəta</li>
                    )}
                  </ul>
                )}
                <button
                  onClick={() => setImportResult(null)}
                  className="mt-2 text-xs underline opacity-70 hover:opacity-100"
                >
                  Bağla
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-10 flex flex-col items-center justify-center text-slate-500">
                <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-3" />
                <p className="text-sm">Məlumatlar yüklənir...</p>
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <Users size={40} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nəticə tapılmadı</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 text-left font-semibold">Restoran</th>
                        <th className="px-4 py-3 text-left font-semibold">Admin</th>
                        <th className="px-4 py-3 text-left font-semibold">Email</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Müddət</th>
                        <th className="px-4 py-3 text-right font-semibold">Əməliyyatlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRestaurants.map((r) => (
                        <tr
                          key={r.id}
                          className="hover:bg-slate-50/60 transition"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold grid place-items-center uppercase text-sm">
                                {r.name?.[0] || "?"}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">
                                  {r.name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  ID: {r.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {r.users?.[0]?.name || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {r.email}
                          </td>
                          <td className="px-4 py-3">
                            <Toggle
                              checked={!!r.is_active}
                              onChange={() => handleStatusToggle(r)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-700 text-xs">
                                {r.active_until
                                  ? r.active_until.slice(0, 10)
                                  : "-"}
                              </span>
                              {getExpiryBadge(r.active_until)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5">
                              <IconButton
                                title="Düzənlə"
                                color="amber"
                                onClick={() => {
                                  setSelectedRestaurant(r);
                                  setShowEditUserModal(true);
                                }}
                              >
                                <Pencil size={15} />
                              </IconButton>
                              <IconButton
                                title="Sil"
                                color="red"
                                onClick={() => {
                                  setSelectedRestaurant(r);
                                  setShowDeleteUserModal(true);
                                }}
                              >
                                <Trash2 size={15} />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-slate-100">
                  {filteredRestaurants.map((r) => (
                    <div key={r.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold grid place-items-center uppercase text-sm shrink-0">
                            {r.name?.[0] || "?"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">
                              {r.name}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {r.email}
                            </div>
                          </div>
                        </div>
                        <Toggle
                          checked={!!r.is_active}
                          onChange={() => handleStatusToggle(r)}
                        />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 rounded-lg p-2">
                          <div className="text-slate-400">Admin</div>
                          <div className="text-slate-700 font-medium truncate">
                            {r.users?.[0]?.name || "-"}
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2">
                          <div className="text-slate-400">Müddət</div>
                          <div className="text-slate-700 font-medium">
                            {r.active_until
                              ? r.active_until.slice(0, 10)
                              : "-"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2">{getExpiryBadge(r.active_until)}</div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedRestaurant(r);
                            setShowEditUserModal(true);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100"
                        >
                          <Pencil size={14} /> Düzənlə
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRestaurant(r);
                            setShowDeleteUserModal(true);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100"
                        >
                          <Trash2 size={14} /> Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
                  {filteredRestaurants.length} / {restaurants.length} göstərilir
                </div>
              </>
            )}
          </div>
        </main>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-72 max-w-[80%] bg-white shadow-xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white font-bold">
                    {APP_NAME.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{APP_NAME}</div>
                    <div className="text-[11px] text-slate-500">Admin</div>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-1 text-sm">
                <button
                  onClick={() => {
                    fetchRestaurants();
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Yenilə
                </button>
                <button
                  onClick={() => {
                    setShowAddUserModal(true);
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center gap-2"
                >
                  <Plus size={16} /> Yeni Restoran
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <LogOut size={16} /> Çıxış
                </button>
              </div>
            </div>
          </div>
        )}

        {backupOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3"
            onClick={() => !backupRunning && setBackupOpen(false)}
          >
            <div
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white">
                <div className="flex items-center gap-2">
                  <Database size={22} />
                  <h3 className="text-lg font-bold">Tam Sistem Backup</h3>
                </div>
                <p className="text-xs text-emerald-100 mt-1">
                  Bütün sistem məlumatlarını JSON faylına yadda saxla
                </p>
                {!backupRunning && (
                  <button
                    onClick={() => setBackupOpen(false)}
                    className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-white/20 transition"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
                {!backupRunning && backupLog.length === 0 && (
                  <>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                      <div className="flex items-start gap-2">
                        <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold mb-1">
                            Backup nə daxil edir?
                          </div>
                          <ul className="list-disc list-inside text-xs space-y-0.5 text-blue-700">
                            <li>Restoran və admin siyahısı</li>
                            <li>Masalar və masa qrupları</li>
                            <li>Menyu (məhsullar, kateqoriyalar, setlər)</li>
                            <li>Müştərilər və işçilər</li>
                            <li>Kuryerlər, xammallar, zaman paketləri</li>
                            <li>Sürətli sifarişlər</li>
                          </ul>
                          <div className="text-[11px] mt-2 text-blue-600">
                            Fayl başqa restoran sistemində bərpa etmək üçün AI
                            prompt ilə birlikdə istifadə edilir
                            (AI_MIGRATION_PROMPT.txt).
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      <AlertTriangle size={14} className="inline mr-1" />
                      Hər endpoint cari admin token və (varsa) restoran token
                      ilə yoxlanılır. Səlahiyyətiniz olmayan endpointlər xəta
                      hesabatına əlavə ediləcək.
                    </div>
                  </>
                )}

                {(backupRunning || backupLog.length > 0) && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
                        <span>Proqres</span>
                        <span>
                          {backupProgress.current} / {backupProgress.total}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all"
                          style={{
                            width:
                              backupProgress.total > 0
                                ? `${
                                    (backupProgress.current /
                                      backupProgress.total) *
                                    100
                                  }%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-900 text-slate-100 rounded-lg p-3 max-h-72 overflow-y-auto text-xs font-mono">
                      {backupLog.map((line, i) => (
                        <div
                          key={i}
                          className={
                            line.startsWith("✓")
                              ? "text-emerald-400"
                              : line.startsWith("✗")
                              ? "text-rose-400"
                              : line.startsWith("✅")
                              ? "text-emerald-300 font-semibold"
                              : "text-slate-400"
                          }
                        >
                          {line}
                        </div>
                      ))}
                      {backupRunning && (
                        <div className="flex items-center gap-1.5 text-amber-300 mt-1">
                          <Loader2 size={12} className="animate-spin" />
                          Əməliyyat davam edir...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 px-5 py-4 bg-slate-50 border-t border-slate-200">
                {!backupRunning && backupLog.length > 0 ? (
                  <button
                    onClick={() => {
                      setBackupLog([]);
                      setBackupProgress({ current: 0, total: 0 });
                      setBackupOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                  >
                    Bağla
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setBackupOpen(false)}
                      disabled={backupRunning}
                      className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 transition"
                    >
                      Ləğv et
                    </button>
                    <button
                      onClick={handleFullBackup}
                      disabled={backupRunning}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition"
                    >
                      {backupRunning ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Hazırlanır...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          Backup al və endir
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {showAddUserModal && (
          <AddUserModal
            onAddUser={handleAddRestaurant}
            onClose={() => setShowAddUserModal(false)}
          />
        )}
        {showEditUserModal && selectedRestaurant && (
          <EditUserModal
            user={selectedRestaurant}
            onEditUser={handleEditRestaurant}
            onClose={() => setShowEditUserModal(false)}
          />
        )}
        {showDeleteUserModal && selectedRestaurant && (
          <DeleteUserModal
            user={selectedRestaurant}
            onDeleteUser={() => handleDeleteRestaurant(selectedRestaurant.id)}
            onClose={() => setShowDeleteUserModal(false)}
          />
        )}
      </div>
    </>
  );
}

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center gap-3">
    <div
      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} text-white grid place-items-center shadow-md shrink-0`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-[11px] sm:text-xs text-slate-500 font-medium uppercase tracking-wide truncate">
        {label}
      </div>
      <div className="text-xl sm:text-2xl font-bold text-slate-800">
        {value}
      </div>
    </div>
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
      checked ? "bg-emerald-500" : "bg-slate-300"
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
        checked ? "translate-x-5" : "translate-x-0.5"
      }`}
    />
  </button>
);

const IconButton = ({ children, color, onClick, title }) => {
  const colorMap = {
    amber: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    red: "bg-red-50 text-red-700 hover:bg-red-100",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition ${colorMap[color]}`}
    >
      {children}
    </button>
  );
};

const MenuItem = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
  >
    <span className="text-slate-500">{icon}</span>
    <span>{label}</span>
  </button>
);

export default Dashboard;
