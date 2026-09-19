import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Bell,
  Send,
  Search,
  Users,
  UserCheck,
  CheckSquare,
  Info,
  CheckCircle2,
  AlertTriangle,
  Siren,
  Sparkles,
  Link2,
  History,
  Megaphone,
} from "lucide-react";
import { adminGet, adminPost, friendlyError } from "./adminApi";
import Input, { inputBase } from "./ui/Input";
import Button from "./ui/Button";
import { Card, CardHeader } from "./ui/Card";
import Badge from "./ui/Badge";
import ConfirmDialog from "./ui/ConfirmDialog";
import EmptyState from "./ui/EmptyState";

const TYPES = [
  { id: "info", label: "Məlumat", icon: Info, tone: "info" },
  { id: "success", label: "Uğur", icon: CheckCircle2, tone: "success" },
  { id: "warning", label: "Xəbərdarlıq", icon: AlertTriangle, tone: "warning" },
  { id: "alert", label: "Alert", icon: Siren, tone: "danger" },
  { id: "promo", label: "Promo", icon: Sparkles, tone: "purple" },
];

const PRIORITIES = [
  { id: "low", label: "Aşağı", tone: "neutral" },
  { id: "normal", label: "Normal", tone: "info" },
  { id: "high", label: "Yüksək", tone: "warning" },
  { id: "urgent", label: "Təcili", tone: "danger" },
];

const isActiveRestaurant = (r) =>
  r.is_active && (!r.active_until || new Date(r.active_until) > new Date());

const typeMeta = (id) => TYPES.find((t) => t.id === id) || TYPES[0];
const prioMeta = (id) => PRIORITIES.find((t) => t.id === id) || PRIORITIES[1];

function Pill({ on, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition min-h-10",
        on
          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
          : "bg-white dark:bg-[#111a2e] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#1f2a44] hover:border-indigo-300",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function AdminNotifications() {
  const [searchParams] = useSearchParams();
  const preselect = Number(searchParams.get("restaurant") || 0);
  const [tab, setTab] = useState("compose");
  const [restaurants, setRestaurants] = useState([]);
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState("info");
  const [priority, setPriority] = useState("normal");
  const [mode, setMode] = useState(preselect ? "selected" : "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [historyQ, setHistoryQ] = useState("");
  const [selected, setSelected] = useState(preselect ? [preselect] : []);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [r, n] = await Promise.all([
      adminGet("/admin-restaurants"),
      adminGet("/admin/notifications"),
    ]);
    setRestaurants(Array.isArray(r.data) ? r.data : []);
    setItems(Array.isArray(n.data) ? n.data : []);
  };

  useEffect(() => {
    load()
      .catch((e) => toast.error(friendlyError(e, "Məlumat yüklənmədi")))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = useMemo(
    () => restaurants.filter(isActiveRestaurant).length,
    [restaurants]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return restaurants.filter((r) => {
      const active = isActiveRestaurant(r);
      if (statusFilter === "active" && !active) return false;
      if (statusFilter === "inactive" && active) return false;
      if (!q) return true;
      return (
        String(r.name || "").toLowerCase().includes(q) ||
        String(r.users?.[0]?.email || "").toLowerCase().includes(q) ||
        String(r.id).includes(q)
      );
    });
  }, [restaurants, search, statusFilter]);

  const recipientCount = useMemo(() => {
    if (mode === "all") return restaurants.length;
    if (mode === "group") {
      if (statusFilter === "active") return activeCount;
      if (statusFilter === "inactive") return restaurants.length - activeCount;
      return restaurants.length;
    }
    return selected.length;
  }, [mode, restaurants.length, activeCount, statusFilter, selected.length]);

  const history = useMemo(() => {
    const q = historyQ.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (n) =>
        String(n.title || "").toLowerCase().includes(q) ||
        String(n.body || "").toLowerCase().includes(q)
    );
  }, [items, historyQ]);

  const failedItems = items.filter((n) => n.failed_count > 0 || n.status === "failed");
  const TypeIcon = typeMeta(type).icon;

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleFiltered = () => {
    const ids = filtered.map((r) => r.id);
    const allOn = ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected((prev) =>
      allOn ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]
    );
  };

  const canSend = title.trim() && body.trim() && recipientCount > 0;

  const doSend = async () => {
    if (!canSend) return;
    setSaving(true);
    try {
      const res = await adminPost("/admin/notifications", {
        title: title.trim(),
        body: body.trim(),
        link: link.trim() || null,
        type,
        priority,
        broadcast: mode === "all" || mode === "group",
        restaurant_ids: mode === "selected" ? selected : [],
        filter: { status: mode === "group" ? statusFilter : "all" },
      });
      setTitle("");
      setBody("");
      setLink("");
      setConfirmOpen(false);
      toast.success(res.data.message || `${res.data.sent} restorana göndərildi`);
      if (res.data.failed) toast.warn(`${res.data.failed} uğursuz`);
      await load();
      setTab("history");
    } catch (err) {
      toast.error(friendlyError(err, "Göndərilmədi"));
    } finally {
      setSaving(false);
    }
  };

  const modeHint =
    mode === "all"
      ? `Bütün restoranlar (${restaurants.length})`
      : mode === "group"
        ? `Filtr: ${statusFilter === "active" ? "aktiv" : statusFilter === "inactive" ? "deaktiv" : "hamısı"} · ${recipientCount} restoran`
        : `${selected.length} restoran seçilib`;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="h-16 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-[#1f2a44] animate-pulse" />
        <div className="h-80 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-[#1f2a44] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0b1220] flex flex-col">
      <div className="bg-white dark:bg-[#111a2e] border-b border-slate-200 dark:border-[#1f2a44] px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white grid place-items-center shrink-0 shadow-md">
              <Megaphone size={20} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Bildiriş göndər
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Restoran panellərində zəng bildirişi kimi görünür
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{recipientCount} alıcı</Badge>
            <Button
              variant="primary"
              icon={Send}
              disabled={!canSend}
              onClick={() => setConfirmOpen(true)}
            >
              Göndər
            </Button>
          </div>
        </div>

        <div className="mt-4 flex gap-1">
          {[
            { id: "compose", label: "Yeni bildiriş", icon: Send },
            { id: "history", label: "Tarixçə", icon: History, badge: items.length },
          ].map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                  on
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <Icon size={15} />
                {t.label}
                {t.badge != null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      on ? "bg-white/20" : "bg-slate-100 dark:bg-white/10"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-5 pb-28">
        {tab === "compose" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-8 space-y-4">
              <Card className="space-y-4">
                <CardHeader
                  title="Kimə göndərilsin?"
                  description="Hamısına, yalnız aktivlərə və ya seçilmiş restoranlara."
                />
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { id: "all", label: "Hamısı", hint: `${restaurants.length} restoran`, icon: Users },
                    { id: "group", label: "Yalnız aktiv", hint: `${activeCount} aktiv`, icon: UserCheck },
                    { id: "selected", label: "Seçilmiş", hint: `${selected.length} seçilib`, icon: CheckSquare },
                  ].map((m) => {
                    const Icon = m.icon;
                    const on = mode === m.id || (m.id === "group" && mode === "group");
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setMode(m.id);
                          if (m.id === "group") setStatusFilter("active");
                        }}
                        className={`text-left p-4 rounded-2xl border transition ${
                          on
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-500/30"
                            : "border-slate-200 dark:border-[#1f2a44] hover:border-indigo-300 bg-white dark:bg-[#0f1830]"
                        }`}
                      >
                        <Icon size={18} className={on ? "text-indigo-600" : "text-slate-400"} />
                        <div className="mt-2 font-semibold text-slate-800 dark:text-slate-100">{m.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{m.hint}</div>
                      </button>
                    );
                  })}
                </div>
                {mode === "group" && (
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["active", "Aktiv"],
                      ["inactive", "Deaktiv"],
                      ["all", "Filtrsiz hamısı"],
                    ].map(([id, label]) => (
                      <Pill key={id} on={statusFilter === id} onClick={() => setStatusFilter(id)}>
                        {label}
                      </Pill>
                    ))}
                  </div>
                )}
              </Card>

              {mode === "selected" && (
                <Card className="space-y-3">
                  <CardHeader
                    title="Restoran seç"
                    description="Axtarış edin və ya siyahıdan işarələyin."
                    right={
                      <Button size="sm" onClick={toggleFiltered}>
                        {filtered.every((r) => selected.includes(r.id)) && filtered.length
                          ? "Filtri sil"
                          : "Filtri seç"}
                      </Button>
                    }
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input
                        icon={Search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Ad, email və ya ID"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className={`${inputBase} sm:w-40`}
                    >
                      <option value="all">Hamısı</option>
                      <option value="active">Aktiv</option>
                      <option value="inactive">Deaktiv</option>
                    </select>
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 dark:border-[#1f2a44] p-2 grid sm:grid-cols-2 gap-1">
                    {filtered.length === 0 && (
                      <p className="text-sm text-slate-500 p-3 col-span-2">Nəticə yoxdur.</p>
                    )}
                    {filtered.map((r) => {
                      const on = selected.includes(r.id);
                      const active = isActiveRestaurant(r);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => toggle(r.id)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition ${
                            on
                              ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-200"
                              : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded border grid place-items-center shrink-0 ${
                              on ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300"
                            }`}
                          >
                            {on ? <CheckCircle2 size={12} /> : null}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                          <span className="text-[11px] text-slate-400 shrink-0">#{r.id}</span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              active ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </Card>
              )}

              <Card className="space-y-4">
                <CardHeader title="Məzmun" description="Başlıq və mətn restoran panelində görünəcək." />
                <Input
                  label="Başlıq"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 180))}
                  placeholder="Məs. Sistem yeniləməsi"
                  required
                  hint={`${title.length}/180`}
                />
                <label className="block text-sm">
                  <span className="block mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    Mətn
                  </span>
                  <textarea
                    rows={5}
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, 4000))}
                    placeholder="Bildirişin tam mətni…"
                    className={inputBase}
                  />
                  <span className="mt-1 block text-xs text-slate-500">{body.length}/4000</span>
                </label>
                <Input
                  label="Link (istəyə bağlı)"
                  icon={Link2}
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://"
                />

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">
                    Növ
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map((t) => {
                      const Icon = t.icon;
                      return (
                        <Pill key={t.id} on={type === t.id} onClick={() => setType(t.id)}>
                          <Icon size={14} /> {t.label}
                        </Pill>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">
                    Prioritet
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITIES.map((t) => (
                      <Pill key={t.id} on={priority === t.id} onClick={() => setPriority(t.id)}>
                        {t.label}
                      </Pill>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-20 self-start">
              <Card>
                <CardHeader title="Restoran panelində belə görünür" />
                <div className="rounded-2xl border border-slate-200 dark:border-[#1f2a44] bg-slate-100 dark:bg-[#0b1220] p-4">
                  <div className="mx-auto max-w-[20rem] bg-white dark:bg-[#111a2e] rounded-xl shadow-lg overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-[#1f2a44] flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Bildirişlər</span>
                      <Bell size={14} className="text-slate-400" />
                    </div>
                    <div className="px-3 py-3 bg-indigo-50/70 dark:bg-indigo-500/10">
                      <div className="flex items-start gap-2">
                        <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white grid place-items-center shrink-0">
                          <TypeIcon size={14} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-100 break-words">
                            {title.trim() || "Başlıq"}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 whitespace-pre-wrap break-words">
                            {body.trim() || "Mətn burada görünəcək"}
                          </div>
                          {link.trim() ? (
                            <div className="text-[11px] text-indigo-600 mt-1 truncate">{link}</div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 justify-center">
                    <Badge tone={typeMeta(type).tone} icon={TypeIcon}>
                      {typeMeta(type).label}
                    </Badge>
                    <Badge tone={prioMeta(priority).tone}>{prioMeta(priority).label}</Badge>
                  </div>
                </div>
              </Card>
              <Card className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Xülasə</div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{modeHint}</p>
                {failedItems.length > 0 && (
                  <p className="text-xs text-rose-600">
                    Tarixçədə {failedItems.length} uğursuz/qismən göndərmə var.
                  </p>
                )}
              </Card>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="sm:max-w-sm w-full">
              <Input
                icon={Search}
                value={historyQ}
                onChange={(e) => setHistoryQ(e.target.value)}
                placeholder="Tarixçədə axtar…"
              />
            </div>
              {failedItems.length > 0 && (
                <Badge tone="danger">{failedItems.length} uğursuz</Badge>
              )}
            </div>
            {history.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Bell}
                  title="Bildiriş yoxdur"
                  description="Göndərilən bildirişlər burada toplanır."
                  cta="Yeni bildiriş"
                  onCta={() => setTab("compose")}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {history.map((n) => {
                  const t = typeMeta(n.type);
                  const p = prioMeta(n.priority);
                  const Icon = t.icon;
                  return (
                    <Card key={n.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {n.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {n.creator?.email || "admin"} ·{" "}
                            {n.created_at ? String(n.created_at).slice(0, 16).replace("T", " ") : ""}
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-1 shrink-0">
                          <Badge tone={t.tone} icon={Icon}>
                            {t.label}
                          </Badge>
                          <Badge tone={p.tone}>{p.label}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-4">
                        {n.body}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{n.targets_count || n.targets?.length || 0} restoran</span>
                        {n.failed_count > 0 && (
                          <span className="text-rose-600 font-medium">{n.failed_count} uğursuz</span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {tab === "compose" && (
        <div className="sticky bottom-16 md:bottom-0 z-20 border-t border-slate-200 dark:border-[#1f2a44] bg-white/95 dark:bg-[#111a2e]/95 backdrop-blur px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-slate-500 truncate">{modeHint}</p>
          <Button
            variant="primary"
            icon={Send}
            disabled={!canSend}
            onClick={() => setConfirmOpen(true)}
          >
            Göndər
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doSend}
        variant="primary"
        title="Bildirişi göndər?"
        description={`${modeHint}. Restoran panellərində dərhal görünəcək.`}
        confirmText="Göndər"
        cancelText="Ləğv et"
        loading={saving}
      />
    </div>
  );
}

export default AdminNotifications;
