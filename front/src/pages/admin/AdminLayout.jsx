import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { pageTitle, APP_NAME } from "../../config/branding";
import {
  Building2,
  Bell,
  KeyRound,
  ScrollText,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

const NAV = [
  { to: "/adminPage/dashboard", label: "Restoranlar", icon: Building2, end: true },
  { to: "/adminPage/notifications", label: "Bildirişlər", icon: Bell },
  { to: "/adminPage/password", label: "Şifrə dəyiş", icon: KeyRound },
  { to: "/adminPage/audit", label: "Əməliyyat jurnalı", icon: ScrollText },
];

function AdminLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const current = NAV.find((n) =>
    n.end
      ? location.pathname === n.to
      : location.pathname.startsWith(n.to)
  );

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) {
      navigate("/adminPage");
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/adminPage");
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle("Super Admin")}</title>
      </Helmet>
      <div className="min-h-screen bg-slate-100 flex">
        {open && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Menyunu bağla"
            onClick={() => setOpen(false)}
          />
        )}

        <aside
          className={`fixed lg:static z-50 inset-y-0 left-0 w-72 max-w-[86%] bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center font-bold">
                {APP_NAME.charAt(0)}
              </div>
              <div>
                <div className="font-bold leading-tight">{APP_NAME}</div>
                <div className="text-[11px] text-slate-400">Super Admin</div>
              </div>
            </div>
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? "bg-white text-slate-900"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/10">
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-200 hover:bg-rose-500/20"
            >
              <LogOut size={18} />
              Çıxış
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setOpen(true)}
              aria-label="Menyunu aç"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <ShieldCheck size={16} className="text-indigo-600" />
              {current?.label || "İdarə paneli"}
            </div>
          </header>
          <div className="flex-1 p-4 sm:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminLayout;
