import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import DateTimeDisplay from "./DateTimeDisplay";
import { connect } from "react-redux";
import { logOut } from "../action/MainAction";
import NewOrders from "./NewOrders";
import WebOrdersBell from "./WebOrdersBell";
import RestaurantNoticeBell from "./RestaurantNoticeBell";
import { base_url, img_url } from "../api/index";
import { APP_NAME, BACKUP_FORMAT_ID } from "../config/branding";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useUiSettings } from "../context/UiSettingsContext";
import { pathToPageKey } from "../config/uiSettings";
import {
  Menu,
  X,
  Moon,
  Sun,
  LayoutGrid,
  LayoutDashboard,
  Receipt,
  Users,
  Wallet,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Package,
  Truck,
  Table2,
  UserCog,
  SlidersHorizontal,
  Boxes,
  Banknote,
  Layers,
  Database,
  Loader2,
} from "lucide-react";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
};

const Header = ({ token, logOut }) => {
  const { t } = useLanguage();
  const { isDark, toggle } = useTheme();
  const { isPageVisible } = useUiSettings();
  const [tanimDropShow, setTanimDropShow] = useState(false);
  const [profDropShow, setProfDropShow] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTanimOpen, setMobileTanimOpen] = useState(false);
  const [meData, setMeData] = useState({});
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [formData, setFormData] = useState({ logo: null, name: "" });
  const [backupRunning, setBackupRunning] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar_expanded_groups");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const toggleGroup = (id) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("sidebar_expanded_groups", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const tanimRef = useRef(null);
  const profRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("restoran_name", formData?.name || "");
  }, [formData]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileTanimOpen(false);
    setProfDropShow(false);
    setTanimDropShow(false);
  }, [location.pathname]);

  // Cari URL hansı qrupa aiddirsə onu avtomatik açıq saxla
  useEffect(() => {
    const activeGroupIds = [];
    [
      {
        id: "anbar",
        paths: ["/stok", "/material", "/stocksadd"],
      },
      {
        id: "heyet",
        paths: ["/personel-tanimlari", "/couriers"],
      },
      {
        id: "nizamlama",
        paths: ["/masa-tanimlari", "/genel-ayarlar"],
      },
      {
        id: "maliyye",
        paths: ["/expenses"],
      },
    ].forEach((g) => {
      if (g.paths.some((p) => location.pathname.startsWith(p))) {
        activeGroupIds.push(g.id);
      }
    });
    if (activeGroupIds.length) {
      setExpandedGroups((prev) => {
        const next = { ...prev };
        let changed = false;
        activeGroupIds.forEach((id) => {
          if (!next[id]) {
            next[id] = true;
            changed = true;
          }
        });
        if (!changed) return prev;
        try {
          localStorage.setItem("sidebar_expanded_groups", JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
  }, [location.pathname]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(
        `${base_url}/own-restaurants`,
        getAuthHeaders()
      );
      setFormData({
        logo: response.data.logo || null,
        name: response.data.name || "",
      });
    } catch (error) {
      console.error("Error fetching settings", error);
    }
  };

  const fetchMe = async () => {
    try {
      const response = await axios.get(`${base_url}/me`, getAuthHeaders());
      setMeData(response.data);
      const userRole = response.data.roles?.[0]?.name || "";
      setRole(userRole);
      localStorage.setItem("role", userRole);
    } catch (error) {
      console.error("Error fetching user data", error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchMe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tanimRef.current && !tanimRef.current.contains(event.target))
        setTanimDropShow(false);
      if (profRef.current && !profRef.current.contains(event.target))
        setProfDropShow(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logOut();
    try {
      const { invalidateSecuritySettingsCache } = await import(
        "../utils/securityPasswords"
      );
      invalidateSecuritySettingsCache();
    } catch (e) {}
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("super_admin_pin_bypass");
    navigate("/");
  };

  const handleRestaurantBackup = async () => {
    setBackupRunning(true);
    setProfDropShow(false);

    const endpoints = [
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

    const backup = {
      meta: {
        format: BACKUP_FORMAT_ID,
        version: "1.0",
        scope: "restaurant",
        exported_at: new Date().toISOString(),
        source_url: window.location.origin,
        api_url: base_url,
        restaurant_name: formData.name || "",
        notes:
          "Restoran səviyyəli backup. Başqa restoran sistemində bərpa üçün AI_MIGRATION_PROMPT.txt sənədinə baxın.",
      },
      data: {},
      errors: {},
    };

    for (const ep of endpoints) {
      try {
        const res = await axios.get(`${base_url}${ep.url}`, getAuthHeaders());
        backup.data[ep.key] = res.data;
      } catch (err) {
        backup.errors[ep.key] = {
          status: err?.response?.status || "?",
          message: err?.message || "error",
        };
      }
    }

    const itemCount = Object.values(backup.data).reduce(
      (acc, v) => acc + (Array.isArray(v) ? v.length : v ? 1 : 0),
      0
    );
    backup.meta.total_items = itemCount;

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const safeName = (formData.name || "restoran")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_${safeName}_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupRunning(false);
    alert(
      t("nav.backupReady", {
        count: itemCount,
        errors: Object.keys(backup.errors).length,
      })
    );
  };

  const replaceImage = (url) => (url ? `${img_url}/${url}` : "");

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

  if (!token) return null;

  const mainLinks = [
    { to: "/panel", label: t("nav.dashboard"), icon: <LayoutDashboard size={17} /> },
    { to: "/masalar", label: t("nav.tables"), icon: <LayoutGrid size={17} /> },
  ];
  if (role !== "waiter") {
    mainLinks.push(
      { to: "/siparisler", label: t("nav.orders"), icon: <Receipt size={17} /> },
      { to: "/musteriler", label: t("nav.customers"), icon: <Users size={17} /> },
      { to: "/gunluk-kasa", label: t("nav.cash"), icon: <Wallet size={17} /> }
    );
  }

  const tanimGroups = [
    {
      id: "anbar",
      label: t("nav.groupWarehouse"),
      icon: <Boxes size={15} />,
      items: [
        { to: "/stok", label: t("nav.warehouseProducts"), icon: <Package size={15} /> },
        { to: "/material", label: t("nav.rawMaterials"), icon: <Boxes size={15} /> },
        { to: "/stocksadd", label: t("nav.sets"), icon: <Layers size={15} /> },
      ],
    },
    {
      id: "heyet",
      label: t("nav.groupStaff"),
      icon: <Users size={15} />,
      items: [
        { to: "/personel-tanimlari", label: t("nav.staffRegistration"), icon: <UserCog size={15} /> },
        { to: "/couriers", label: t("nav.courierRegistration"), icon: <Truck size={15} /> },
      ],
    },
    {
      id: "nizamlama",
      label: t("nav.groupSettings"),
      icon: <SlidersHorizontal size={15} />,
      items: [
        { to: "/masa-tanimlari", label: t("nav.tableSettings"), icon: <Table2 size={15} /> },
        { to: "/genel-ayarlar", label: t("nav.generalSettings"), icon: <Settings size={15} /> },
      ],
    },
    {
      id: "maliyye",
      label: t("nav.groupFinance"),
      icon: <Wallet size={15} />,
      items: [
        { to: "/expenses", label: t("nav.expenses"), icon: <Banknote size={15} /> },
      ],
    },
  ];

  const isLinkVisible = (to) => {
    const key = pathToPageKey(to);
    return key ? isPageVisible(key) : true;
  };

  const visibleMainLinks = mainLinks.filter((l) => isLinkVisible(l.to));
  const visibleTanimGroups = tanimGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => isLinkVisible(i.to)) }))
    .filter((g) => g.items.length > 0);
  const allTanimItems = visibleTanimGroups.flatMap((g) => g.items);

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="px-3 sm:px-5 h-14 flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>

          <Link to="/masalar" className="flex items-center gap-2 shrink-0">
            {formData.logo ? (
              <img
                src={replaceImage(formData.logo)}
                alt="Logo"
                className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white font-bold shadow">
                {(formData.name || "S").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 max-w-[10rem] truncate">
                {formData.name || APP_NAME}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                {t("common.posSystem")}
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1 ml-3">
            {visibleMainLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(l.to)
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {l.icon}
                <span>{l.label}</span>
              </Link>
            ))}

            {role !== "waiter" && visibleTanimGroups.length > 0 && (
              <div className="relative" ref={tanimRef}>
                <button
                  onClick={() => setTanimDropShow((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    allTanimItems.some((i) => isActive(i.to))
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Settings size={17} />
                  <span>{t("common.definitions")}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      tanimDropShow ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {tanimDropShow && (
                  <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-50 max-h-[70vh] overflow-y-auto">
                    {visibleTanimGroups.map((group) => {
                      const isOpen = !!expandedGroups[group.id];
                      const hasActive = group.items.some((i) => isActive(i.to));
                      return (
                        <div key={group.id} className="px-1">
                          <button
                            onClick={() => toggleGroup(group.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-semibold transition ${
                              hasActive
                                ? "text-indigo-700"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                            aria-expanded={isOpen}
                          >
                            <span className="text-slate-500">{group.icon}</span>
                            <span className="flex-1 text-left">{group.label}</span>
                            <ChevronRight
                              size={14}
                              className={`transition-transform duration-200 text-slate-400 ${
                                isOpen ? "rotate-90" : ""
                              }`}
                            />
                          </button>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="pl-3 ml-3 border-l border-slate-200 my-1 space-y-0.5">
                              {group.items.map((item) => (
                                <Link
                                  key={item.to}
                                  to={item.to}
                                  onClick={() => setTanimDropShow(false)}
                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition ${
                                    isActive(item.to)
                                      ? "bg-indigo-50 text-indigo-700 font-medium"
                                      : "text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <span className="text-slate-400">{item.icon}</span>
                                  <span>{item.label}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {role !== "waiter" && <WebOrdersBell />}
            {role !== "waiter" && <RestaurantNoticeBell />}
            <button
              type="button"
              onClick={toggle}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title={isDark ? t("common.lightMode") : t("common.darkMode")}
              aria-label={isDark ? t("common.lightMode") : t("common.darkMode")}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="hidden md:flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <NewOrders />
              <div className="hidden lg:block">
                <DateTimeDisplay />
              </div>
            </div>

            <div className="relative" ref={profRef}>
              <button
                onClick={() => setProfDropShow((v) => !v)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white grid place-items-center text-xs font-semibold uppercase shadow">
                  {(meData.name || "U").charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-semibold text-slate-800 max-w-[7rem] truncate">
                    {meData.name || t("common.user")}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {role || "user"}
                  </span>
                </div>
                <ChevronDown size={14} className="hidden sm:block text-slate-400" />
              </button>
              {profDropShow && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                  <div className="px-3 pb-2 mb-1 border-b border-slate-100 dark:border-slate-700">
                    <div className="text-sm font-semibold text-slate-800 truncate">
                      {meData.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {meData.email}
                    </div>
                  </div>
                  <Link
                    to="/genel-ayarlar"
                    onClick={() => setProfDropShow(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <SlidersHorizontal size={15} /> Nizamlamalar
                  </Link>
                  {role !== "waiter" && (
                    <button
                      onClick={handleRestaurantBackup}
                      disabled={backupRunning}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                    >
                      {backupRunning ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Backup alınır...
                        </>
                      ) : (
                        <>
                          <Database size={15} /> Tam Backup al
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} /> {t("common.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 h-14 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                {formData.logo ? (
                  <img
                    src={replaceImage(formData.logo)}
                    alt="Logo"
                    className="w-9 h-9 rounded-lg object-cover bg-slate-100"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white font-bold">
                    {(formData.name || "S").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="leading-tight">
                  <div className="text-sm font-bold text-slate-800 truncate max-w-[10rem]">
                    {formData.name || APP_NAME}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">POS</div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white grid place-items-center font-semibold uppercase">
                {(meData.name || "U").charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {meData.name}
                </div>
                <div className="text-xs text-slate-500 capitalize truncate">
                  {role || "user"}
                </div>
              </div>
            </div>

            <div className="p-3 border-b border-slate-100 space-y-1.5">
              {role !== "waiter" && <WebOrdersBell />}
              {role !== "waiter" && <RestaurantNoticeBell />}
              <NewOrders />
              <DateTimeDisplay />
            </div>

            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {visibleMainLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive(l.to)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {l.icon}
                  <span>{l.label}</span>
                </Link>
              ))}

              {role !== "waiter" && visibleTanimGroups.length > 0 && (
                <div>
                  <button
                    onClick={() => setMobileTanimOpen((v) => !v)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                    aria-expanded={mobileTanimOpen}
                  >
                    <Settings size={17} />
                    <span>{t("common.definitions")}</span>
                    <ChevronDown
                      size={14}
                      className={`ml-auto transition-transform ${
                        mobileTanimOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      mobileTanimOpen
                        ? "max-h-[600px] opacity-100 mt-1"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="ml-2 pl-2 border-l-2 border-slate-100 space-y-1">
                      {visibleTanimGroups.map((group) => {
                        const isOpen = !!expandedGroups[group.id];
                        const hasActive = group.items.some((i) => isActive(i.to));
                        return (
                          <div key={group.id}>
                            <button
                              onClick={() => toggleGroup(group.id)}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-semibold transition ${
                                hasActive
                                  ? "text-indigo-700 bg-indigo-50/40"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                              aria-expanded={isOpen}
                            >
                              <span className="text-slate-500">{group.icon}</span>
                              <span className="flex-1 text-left">
                                {group.label}
                              </span>
                              <ChevronRight
                                size={14}
                                className={`transition-transform duration-200 text-slate-400 ${
                                  isOpen ? "rotate-90" : ""
                                }`}
                              />
                            </button>
                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isOpen
                                  ? "max-h-96 opacity-100"
                                  : "max-h-0 opacity-0"
                              }`}
                            >
                              <div className="pl-3 ml-3 border-l border-slate-200 my-1 space-y-0.5">
                                {group.items.map((item) => (
                                  <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-sm transition ${
                                      isActive(item.to)
                                        ? "bg-indigo-50 text-indigo-700 font-medium"
                                        : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    <span className="text-slate-400">{item.icon}</span>
                                    <span>{item.label}</span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </nav>

            <div className="p-3 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition"
              >
                <LogOut size={16} />
                {t("common.logout")}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

const mapStateToProps = (state) => ({
  token: state.Data.token,
});

const mapDispatchToProps = { logOut };

export default connect(mapStateToProps, mapDispatchToProps)(Header);
