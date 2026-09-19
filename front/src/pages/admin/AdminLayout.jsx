import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { pageTitle, APP_NAME } from "../../config/branding";
import { adminGet } from "./adminApi";
import { useAdminTheme } from "./ui/theme";
import CommandPalette from "./ui/CommandPalette";
import {
  LayoutDashboard,
  Building2,
  Bell,
  Globe,
  Boxes,
  Database,
  ScrollText,
  UserRoundCog,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Search,
  Moon,
  Sun,
  Laptop,
  Command,
  Home,
  MoreHorizontal,
} from "lucide-react";

const GROUPS = [
  {
    id: "main",
    label: "Ümumi",
    items: [
      { to: "/adminPage/home", label: "Dashboard", icon: LayoutDashboard },
      { to: "/adminPage/dashboard", label: "Restoranlar", icon: Building2, end: true },
      { to: "/adminPage/notifications", label: "Bildirişlər", icon: Bell, badgeKey: "notifications_unread" },
    ],
  },
  {
    id: "site",
    label: "Sayt",
    items: [
      { to: "/adminPage/website", label: "Sayt ayarları", icon: Globe },
      { to: "/adminPage/packages", label: "Paketlər", icon: Boxes },
    ],
  },
  {
    id: "system",
    label: "Sistem",
    items: [
      { to: "/adminPage/backups", label: "Backup", icon: Database },
      { to: "/adminPage/audit", label: "Audit log", icon: ScrollText },
      { to: "/adminPage/account", label: "Hesab və şifrə", icon: UserRoundCog },
    ],
  },
];

const COLLAPSE_KEY = "sc_admin_sidebar_collapsed_v2";
const GROUPS_KEY = "sc_admin_sidebar_groups";

function loadGroups() {
  try {
    return JSON.parse(localStorage.getItem(GROUPS_KEY) || "{}");
  } catch {
    return {};
  }
}

function useOutside(ref, cb) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) cb?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => ({
    main: true,
    site: true,
    system: true,
    ...loadGroups(),
  }));
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [me, setMe] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const restaurantMatch = useMatch("/adminPage/restaurants/:id");
  const params = restaurantMatch?.params || {};
  const isFullBleed =
    location.pathname.startsWith("/adminPage/website") ||
    location.pathname.startsWith("/adminPage/notifications") ||
    location.pathname.startsWith("/adminPage/account");

  const { theme, setTheme } = useAdminTheme(location.pathname.startsWith("/adminPage"));

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  useOutside(userMenuRef, () => setUserMenuOpen(false));
  useOutside(notifRef, () => setNotifOpen(false));

  const currentNav = useMemo(() => {
    const all = GROUPS.flatMap((g) => g.items);
    if (location.pathname.startsWith("/adminPage/restaurants/")) {
      return all.find((n) => n.to === "/adminPage/dashboard") || all[0];
    }
    if (location.pathname.startsWith("/adminPage/password")) {
      return all.find((n) => n.to === "/adminPage/account") || all[0];
    }
    return (
      all.find((n) =>
        n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
      ) || all[0]
    );
  }, [location.pathname]);

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) {
      navigate("/adminPage");
    }
  }, [navigate]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    adminGet("/admin/me").then((r) => setMe(r.data)).catch(() => setMe(null));
    adminGet("/admin/notifications")
      .then((r) => setNotifs(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotifs([]));
  }, []);

  useEffect(() => {
    const id = params.id;
    if (!id || !/^\d+$/.test(String(id))) {
      setRestaurantName(null);
      return;
    }
    adminGet(`/admin-restaurants/${id}`)
      .then((r) => {
        const n = r.data?.restaurant?.name || r.data?.name;
        setRestaurantName(n || `#${id}`);
      })
      .catch(() => setRestaurantName(`#${id}`));
  }, [params.id]);

  useEffect(() => {
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const persistCollapsed = (value) => {
    setCollapsed(value);
    localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
  };

  const toggleGroup = (id) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(GROUPS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/adminPage");
  };

  const cycleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  }, [theme, setTheme]);

  const handlePaletteTheme = (mode) => {
    if (mode) setTheme(mode);
    else cycleTheme();
  };

  const asideWidth = collapsed ? "lg:w-[76px]" : "lg:w-72";

  const badgeCounts = {
    notifications_unread: notifs.filter((n) => n.failed_count > 0).length || 0,
  };

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ label: "Admin", to: "/adminPage/home" }];
    if (currentNav) {
      crumbs.push({ label: currentNav.label, to: currentNav.to });
    }
    if (location.pathname.includes("/restaurants/") && restaurantName) {
      crumbs.push({ label: `#${params.id} · ${restaurantName}` });
    }
    return crumbs;
  }, [currentNav, location.pathname, params.id, restaurantName]);

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Laptop;

  return (
    <>
      <Helmet>
        <title>{pageTitle(currentNav?.label || "Super Admin")}</title>
      </Helmet>
      <div className="min-h-screen bg-slate-100 dark:bg-[#0b1220] text-slate-800 dark:text-slate-100 flex">
        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Menyunu bağla"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={`fixed lg:static z-50 inset-y-0 left-0 ${asideWidth} max-w-[86%] bg-slate-900 dark:bg-[#0a1024] text-white flex flex-col transform transition-all duration-300 ease-out border-r border-black/40 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className={`px-3 py-4 border-b border-white/10 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
            <button
              type="button"
              className="flex items-center gap-3 min-w-0 text-left"
              onClick={() => collapsed && persistCollapsed(false)}
              title={collapsed ? "Menyunu aç" : undefined}
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center font-bold">
                {APP_NAME.charAt(0)}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="font-bold leading-tight truncate">{APP_NAME}</div>
                  <div className="text-[11px] text-slate-400">CRM · Super Admin</div>
                </div>
              )}
            </button>
            {!collapsed && (
              <button
                type="button"
                className="hidden lg:flex p-2 rounded-lg hover:bg-white/10 text-slate-300"
                onClick={() => persistCollapsed(true)}
                title="Menyunu yığ"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 p-2 space-y-3 overflow-y-auto">
            {GROUPS.map((group) => {
              const opened = collapsed ? true : openGroups[group.id] !== false;
              return (
                <div key={group.id}>
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center justify-between px-2 py-1 text-[11px] uppercase tracking-wide text-slate-400"
                    >
                      {group.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${opened ? "" : "-rotate-90"}`}
                      />
                    </button>
                  )}
                  <div
                    className={`space-y-1 overflow-hidden transition-all duration-300 ${
                      opened ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const badge = item.badgeKey ? badgeCounts[item.badgeKey] : null;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          title={collapsed ? item.label : undefined}
                          className={({ isActive }) =>
                            `flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                              isActive
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-300 hover:bg-white/10 hover:text-white"
                            }`
                          }
                        >
                          <Icon size={18} className="shrink-0" />
                          {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                          {!collapsed && badge > 0 && (
                            <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                              {badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="p-2 border-t border-white/10 space-y-1">
            {collapsed && (
              <button
                type="button"
                onClick={() => persistCollapsed(false)}
                className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-white bg-white/10 hover:bg-white/15"
                title="Menyunu aç"
              >
                <ChevronLeft size={18} className="rotate-180" />
                Aç
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-xl text-sm font-medium text-rose-200 hover:bg-rose-500/20`}
            >
              <LogOut size={18} />
              {!collapsed && "Çıxış"}
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0b1220]/85 backdrop-blur border-b border-slate-200 dark:border-[#1f2a44] px-3 sm:px-4 py-2.5 flex items-center gap-2">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
              onClick={() => setMobileOpen(true)}
              aria-label="Menyunu aç"
            >
              <Menu size={20} />
            </button>

            <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 text-sm min-w-0">
              {breadcrumbs.map((c, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight size={14} className="text-slate-400 dark:text-slate-500" />}
                  {c.to ? (
                    <button
                      type="button"
                      onClick={() => navigate(c.to)}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 truncate max-w-[10rem]"
                    >
                      {c.label}
                    </button>
                  ) : (
                    <span className="text-slate-800 dark:text-slate-100 font-medium truncate max-w-[14rem]">
                      {c.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
            <span className="md:hidden text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {currentNav?.label || "Admin"}
            </span>

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 h-9 px-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 text-sm w-72"
              aria-label="Axtarış paleti"
            >
              <Search size={14} />
              <span className="flex-1 text-left truncate">Axtar…</span>
              <span className="text-[10px] border border-slate-300 dark:border-white/10 rounded px-1 py-0.5 inline-flex items-center gap-0.5">
                <Command size={9} /> K
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label="Axtar"
            >
              <Search size={18} />
            </button>

            <button
              type="button"
              onClick={cycleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
              title={`Rejim: ${theme}`}
              aria-label="Rejim dəyiş"
            >
              <ThemeIcon size={18} />
            </button>

            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                aria-label="Bildirişlər"
              >
                <Bell size={18} />
                {notifs.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 grid place-items-center text-[10px] font-semibold rounded-full bg-rose-500 text-white">
                    {Math.min(9, notifs.length)}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-[#1f2a44] shadow-admin-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1f2a44] flex items-center justify-between">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">Son bildirişlər</div>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate("/adminPage/notifications");
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400"
                    >
                      Hamısına bax
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 && (
                      <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
                        Bildiriş yoxdur.
                      </p>
                    )}
                    {notifs.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        className="px-4 py-3 border-b border-slate-100 dark:border-[#1f2a44] last:border-b-0"
                      >
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {n.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {n.body}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                          {String(n.created_at || "").slice(0, 16).replace("T", " ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold grid place-items-center uppercase">
                  {me?.name?.charAt(0) || me?.email?.charAt(0) || "A"}
                </span>
                <span className="hidden sm:inline text-sm text-slate-700 dark:text-slate-200 max-w-[8rem] truncate">
                  {me?.name || me?.email || "Admin"}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-[#1f2a44] shadow-admin-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1f2a44]">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {me?.name || "Super admin"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {me?.email}
                    </div>
                  </div>
                  <MenuRow
                    icon={UserRoundCog}
                    label="Hesab və şifrə"
                    onClick={() => navigate("/adminPage/account")}
                  />
                  <MenuRow icon={LogOut} label="Çıxış" tone="danger" onClick={logout} />
                </div>
              )}
            </div>
          </header>

          <div
            className={
              isFullBleed
                ? "flex-1 overflow-x-hidden pb-20 md:pb-0"
                : "flex-1 p-4 sm:p-6 overflow-x-hidden pb-24 md:pb-6"
            }
          >
            <Outlet />
          </div>

          <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#0b1220]/95 backdrop-blur border-t border-slate-200 dark:border-[#1f2a44] grid grid-cols-4">
            <MobileNav to="/adminPage/home" icon={Home} label="Ana" />
            <MobileNav to="/adminPage/dashboard" icon={Building2} label="Restoranlar" end />
            <MobileNav to="/adminPage/notifications" icon={Bell} label="Bildiriş" badge={badgeCounts.notifications_unread} />
            <MobileNavMore onClick={() => setMobileOpen(true)} />
          </nav>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onToggleTheme={handlePaletteTheme}
      />
    </>
  );
}

function MenuRow({ icon: Icon, label, onClick, tone = "default" }) {
  const toneCls =
    tone === "danger"
      ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${toneCls}`}
    >
      <Icon size={15} />
      <span>{label}</span>
    </button>
  );
}

function MobileNav({ to, icon: Icon, label, end, badge }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center py-2 text-[10px] ${
          isActive
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-slate-500 dark:text-slate-400"
        }`
      }
    >
      <span className="relative">
        <Icon size={18} />
        {badge > 0 && (
          <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 grid place-items-center text-[9px] font-semibold rounded-full bg-rose-500 text-white px-0.5">
            {badge}
          </span>
        )}
      </span>
      <span className="mt-0.5">{label}</span>
    </NavLink>
  );
}

function MobileNavMore({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center py-2 text-[10px] text-slate-500 dark:text-slate-400"
    >
      <MoreHorizontal size={18} />
      <span className="mt-0.5">Menyu</span>
    </button>
  );
}

export default AdminLayout;
