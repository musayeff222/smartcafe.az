import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, ArrowRight, Command, Home, Bell, Building2, LogOut, Boxes, Database, ScrollText, Globe, UserRoundCog, Moon, Sun, Send, Plus, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminGet } from "../adminApi";

const STATIC_ACTIONS = [
  { id: "nav:home", type: "nav", label: "Dashboard", to: "/adminPage/home", icon: Home, hint: "Ümumi görünüş" },
  { id: "nav:dashboard", type: "nav", label: "Restoranlar", to: "/adminPage/dashboard", icon: Building2 },
  { id: "nav:notifications", type: "nav", label: "Bildirişlər", to: "/adminPage/notifications", icon: Bell },
  { id: "nav:website", type: "nav", label: "Sayt ayarları", to: "/adminPage/website", icon: Globe },
  { id: "nav:packages", type: "nav", label: "Paketlər", to: "/adminPage/packages", icon: Boxes },
  { id: "nav:backups", type: "nav", label: "Backup", to: "/adminPage/backups", icon: Database },
  { id: "nav:audit", type: "nav", label: "Audit log", to: "/adminPage/audit", icon: ScrollText },
  { id: "nav:account", type: "nav", label: "Hesab və şifrə", to: "/adminPage/account", icon: UserRoundCog },
  { id: "nav:password", type: "nav", label: "Şifrəni dəyiş", to: "/adminPage/account", icon: KeyRound },
  { id: "act:new-restaurant", type: "action", label: "Yeni restoran əlavə et", to: "/adminPage/dashboard?new=1", icon: Plus },
  { id: "act:send-notif", type: "action", label: "Bildiriş göndər", to: "/adminPage/notifications", icon: Send },
  { id: "act:theme-toggle", type: "theme", label: "Rejim: açıq/qara dəyiş", icon: Moon },
  { id: "act:theme-light", type: "theme", theme: "light", label: "Light mode", icon: Sun },
  { id: "act:theme-dark", type: "theme", theme: "dark", label: "Dark mode", icon: Moon },
  { id: "act:logout", type: "logout", label: "Çıxış", icon: LogOut },
];

export default function CommandPalette({ open, onClose, onToggleTheme }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setQ("");
      setHighlighted(0);
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (!open || restaurants.length) return;
    adminGet("/admin-restaurants")
      .then((r) => setRestaurants(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRestaurants([]));
  }, [open, restaurants.length]);

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    const acts = STATIC_ACTIONS.map((a) => ({ ...a, score: query ? scoreMatch(a.label, query) : 1 }))
      .filter((a) => !query || a.score > 0);

    const rests = restaurants
      .map((r) => ({
        id: `r:${r.id}`,
        type: "restaurant",
        label: r.name,
        secondary: r.users?.[0]?.email || r.email || `#${r.id}`,
        to: `/adminPage/restaurants/${r.id}`,
        icon: Building2,
        raw: r,
        score: query
          ? scoreMatch(`${r.name} ${r.email || ""} ${r.users?.[0]?.email || ""} ${r.id}`, query)
          : 0.5,
      }))
      .filter((r) => !query || r.score > 0)
      .slice(0, 12);

    return [...acts, ...rests].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [q, restaurants]);

  useEffect(() => {
    setHighlighted(0);
  }, [q]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx='${highlighted}']`);
    el?.scrollIntoView?.({ block: "nearest" });
  }, [highlighted]);

  const run = (item) => {
    if (!item) return;
    if (item.type === "logout") {
      localStorage.removeItem("admin_token");
      navigate("/adminPage");
    } else if (item.type === "theme") {
      onToggleTheme?.(item.theme);
    } else if (item.to) {
      navigate(item.to);
    }
    onClose?.();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(items[highlighted]);
    } else if (e.key === "Escape") {
      onClose?.();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/45 backdrop-blur-sm p-4 flex items-start justify-center pt-24 animate-sc-fade"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#111a2e] rounded-2xl shadow-admin-lg border border-slate-200 dark:border-[#1f2a44] overflow-hidden animate-sc-in"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-[#1f2a44]">
          <Search size={16} className="text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Restoran, əməliyyat, səhifə…"
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 border border-slate-200 dark:border-[#1f2a44] rounded px-1.5 py-0.5">
            <Command size={10} /> K
          </span>
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {items.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400 text-center">
              Heç nə tapılmadı.
            </div>
          )}
          {items.map((item, idx) => {
            const Icon = item.icon;
            const active = idx === highlighted;
            return (
              <button
                key={item.id}
                type="button"
                data-idx={idx}
                onMouseEnter={() => setHighlighted(idx)}
                onClick={() => run(item)}
                className={[
                  "w-full flex items-center gap-3 px-4 py-2 text-left text-sm",
                  active
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-slate-800 dark:text-slate-100"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.02]",
                ].join(" ")}
              >
                <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 grid place-items-center text-slate-500 dark:text-slate-300 shrink-0">
                  {Icon ? <Icon size={14} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.label}</span>
                  {item.secondary && (
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.secondary}
                    </span>
                  )}
                </span>
                {item.type === "nav" && <ArrowRight size={13} className="text-slate-400" />}
              </button>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-slate-100 dark:border-[#1f2a44] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>↑↓ hərəkət · Enter seç · Esc bağla</span>
          <span>smartcafe · CRM</span>
        </div>
      </div>
    </div>
  );
}

function scoreMatch(hay, needle) {
  const h = String(hay || "").toLowerCase();
  const n = String(needle || "").toLowerCase();
  if (!n) return 1;
  if (h.startsWith(n)) return 3;
  if (h.includes(n)) return 2;
  const tokens = n.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => h.includes(t))) return 1.4;
  return 0;
}
