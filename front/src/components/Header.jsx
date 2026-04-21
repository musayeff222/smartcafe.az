import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import DateTimeDisplay from "./DateTimeDisplay";
import { connect } from "react-redux";
import { logOut } from "../action/MainAction";
import NewOrders from "./NewOrders";
import { base_url, img_url } from "../api/index";
import {
  Menu,
  X,
  LayoutGrid,
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
    localStorage.removeItem("token");
    localStorage.removeItem("role");
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
        format: "smartcafe-backup",
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
      `Backup hazırdır! ${itemCount} qeyd endirildi. ${
        Object.keys(backup.errors).length
      } endpoint əlçatmaz idi.`
    );
  };

  const replaceImage = (url) => (url ? `${img_url}/${url}` : "");

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

  if (!token) return null;

  const mainLinks = [
    { to: "/masalar", label: "Masalar", icon: <LayoutGrid size={17} /> },
  ];
  if (role !== "waiter") {
    mainLinks.push(
      { to: "/siparisler", label: "Sifarişlər", icon: <Receipt size={17} /> },
      { to: "/musteriler", label: "Müştərilər", icon: <Users size={17} /> },
      { to: "/gunluk-kasa", label: "Kassa", icon: <Wallet size={17} /> }
    );
  }

  const tanimGroups = [
    {
      id: "anbar",
      label: "Anbar və Məhsul",
      icon: <Boxes size={15} />,
      items: [
        { to: "/stok", label: "Anbara Məhsul", icon: <Package size={15} /> },
        { to: "/material", label: "Xammal", icon: <Boxes size={15} /> },
        { to: "/stocksadd", label: "Setlər", icon: <Layers size={15} /> },
      ],
    },
    {
      id: "heyet",
      label: "Heyət və Kuryer",
      icon: <Users size={15} />,
      items: [
        { to: "/personel-tanimlari", label: "İşçi Qeydiyyatı", icon: <UserCog size={15} /> },
        { to: "/couriers", label: "Kuryer Qeydiyyatı", icon: <Truck size={15} /> },
      ],
    },
    {
      id: "nizamlama",
      label: "Nizamlamalar",
      icon: <SlidersHorizontal size={15} />,
      items: [
        { to: "/masa-tanimlari", label: "Masa Nizamlamaları", icon: <Table2 size={15} /> },
        { to: "/genel-ayarlar", label: "Ümumi Nizamlamalar", icon: <Settings size={15} /> },
      ],
    },
    {
      id: "maliyye",
      label: "Maliyyə",
      icon: <Wallet size={15} />,
      items: [
        { to: "/expenses", label: "Xərclər", icon: <Banknote size={15} /> },
      ],
    },
  ];

  const allTanimItems = tanimGroups.flatMap((g) => g.items);

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="px-3 sm:px-5 h-14 flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
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
              <span className="text-sm font-bold text-slate-800 max-w-[10rem] truncate">
                {formData.name || "Smartcafe"}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                POS System
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1 ml-3">
            {mainLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(l.to)
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {l.icon}
                <span>{l.label}</span>
              </Link>
            ))}

            {role !== "waiter" && (
              <div className="relative" ref={tanimRef}>
                <button
                  onClick={() => setTanimDropShow((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    allTanimItems.some((i) => isActive(i.to))
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Settings size={17} />
                  <span>Tənimlər</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      tanimDropShow ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {tanimDropShow && (
                  <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 max-h-[70vh] overflow-y-auto">
                    {tanimGroups.map((group) => {
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
            <div className="hidden md:flex items-center gap-2 text-slate-600">
              <NewOrders />
              <div className="hidden lg:block">
                <DateTimeDisplay />
              </div>
            </div>

            <div className="relative" ref={profRef}>
              <button
                onClick={() => setProfDropShow((v) => !v)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full hover:bg-slate-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white grid place-items-center text-xs font-semibold uppercase shadow">
                  {(meData.name || "U").charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-semibold text-slate-800 max-w-[7rem] truncate">
                    {meData.name || "İstifadəçi"}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {role || "user"}
                  </span>
                </div>
                <ChevronDown size={14} className="hidden sm:block text-slate-400" />
              </button>
              {profDropShow && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-3 pb-2 mb-1 border-b border-slate-100">
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
                    <LogOut size={15} /> Çıxış
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
            className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-white shadow-2xl flex flex-col"
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
                    {formData.name || "Smartcafe"}
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
              <NewOrders />
              <DateTimeDisplay />
            </div>

            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {mainLinks.map((l) => (
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

              {role !== "waiter" && (
                <div>
                  <button
                    onClick={() => setMobileTanimOpen((v) => !v)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                    aria-expanded={mobileTanimOpen}
                  >
                    <Settings size={17} />
                    <span>Tənimlər</span>
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
                      {tanimGroups.map((group) => {
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
                Çıxış
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
