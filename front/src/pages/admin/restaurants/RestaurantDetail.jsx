import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Bell,
  KeyRound,
  LogIn,
  Trash2,
  Users,
  Wallet,
  ShoppingBag,
  Clock,
  StickyNote,
  Activity,
  Plus,
} from "lucide-react";
import { adminDelete, adminGet, adminPost, friendlyError } from "../adminApi";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Copy from "../ui/Copy";
import ConfirmDialog from "../ui/ConfirmDialog";
import EmptyState from "../ui/EmptyState";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Skeleton from "../ui/Skeleton";
import Tabs from "../ui/Tabs";
import { formatMoney, healthOf } from "./health";
import { startAdminImpersonation } from "../../../utils/adminImpersonation";

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [entering, setEntering] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPw, setResetPw] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, n] = await Promise.all([
        adminGet(`/admin/restaurants/${id}/summary`),
        adminGet(`/admin/restaurants/${id}/notes`).catch(() => ({ data: [] })),
      ]);
      setData(sum.data);
      setNotes(Array.isArray(n.data) ? n.data : []);
    } catch (e) {
      toast.error(friendlyError(e, "Restoran yüklənmədi"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const r = data?.restaurant;
  const health = r ? healthOf(r) : null;

  const enterRestaurant = async () => {
    setEntering(true);
    try {
      const res = await adminPost(`/admin-restaurants/${id}/access-token`, {});
      const token = res.data.access_token;
      if (!token) throw new Error("Token alınmadı");
      localStorage.setItem("token", token);
      localStorage.setItem("role", res.data.role || "admin");
      startAdminImpersonation({
        restaurantId: id,
        restaurantName: r?.name,
      });
      window.location.assign("/masalar");
    } catch (e) {
      toast.error(friendlyError(e, "Restorana girilmədi"));
    } finally {
      setEntering(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setNoteBusy(true);
    try {
      const res = await adminPost(`/admin/restaurants/${id}/notes`, { note: noteText.trim() });
      setNotes((prev) => [res.data, ...prev]);
      setNoteText("");
      toast.success("Qeyd əlavə edildi");
    } catch (e) {
      toast.error(friendlyError(e, "Qeyd yazılmadı"));
    } finally {
      setNoteBusy(false);
    }
  };

  const removeNote = async (noteId) => {
    try {
      await adminDelete(`/admin/restaurants/${id}/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (e) {
      toast.error(friendlyError(e, "Silinmədi"));
    }
  };

  const doReset = async () => {
    if (resetPw.length < 6) {
      toast.error("Yeni şifrə ən az 6 simvol olmalıdır");
      return;
    }
    if (!resetConfirm) {
      toast.error("Super-admin şifrəsi tələb olunur");
      return;
    }
    setResetBusy(true);
    try {
      await adminPost(`/admin/restaurants/${id}/reset-password`, {
        password: resetPw,
        confirm_password: resetConfirm,
      });
      toast.success("Şifrə sıfırlandı");
      setResetOpen(false);
      setResetPw("");
      setResetConfirm("");
    } catch (e) {
      toast.error(friendlyError(e, "Şifrə sıfırlanmadı"));
    } finally {
      setResetBusy(false);
    }
  };

  const doDelete = async ({ password }) => {
    try {
      await adminDelete(`/admin-restaurants/${id}`, { password }, {
        "X-Confirm-Delete": "DELETE",
        "X-Confirm-Password": password,
      });
      toast.success("Silindi");
      navigate("/adminPage/dashboard");
    } catch (e) {
      toast.error(friendlyError(e, "Silinmədi"));
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!r) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Restoran tapılmadı"
        description="Bu ID bazada yoxdur və ya silinib."
        cta="Siyahıya qayıt"
        onCta={() => navigate("/adminPage/dashboard")}
      />
    );
  }

  const stats = data.stats || {};

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/adminPage/dashboard"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 mb-2"
          >
            <ArrowLeft size={14} /> Restoranlar
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold grid place-items-center uppercase">
              {r.name?.[0] || "?"}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 truncate">
                {r.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge tone={health.tone}>{health.label}</Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  #{r.id} <Copy value={r.id} />
                </span>
                {r.email && (
                  <span className="text-xs text-slate-500 flex items-center gap-1 truncate">
                    {r.email} <Copy value={r.email} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={Bell} onClick={() => navigate(`/adminPage/notifications?restaurant=${id}`)}>
            Bildiriş
          </Button>
          <Button variant="secondary" size="sm" icon={LogIn} loading={entering} onClick={enterRestaurant}>
            Restorana gir
          </Button>
          <Button variant="secondary" size="sm" icon={KeyRound} onClick={() => setResetOpen(true)}>
            Şifrə
          </Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteOpen(true)}>
            Sil
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Users} label="İstifadəçilər" value={stats.users_count ?? 0} />
        <Stat icon={ShoppingBag} label="Sifariş (30g)" value={stats.orders_30d ?? 0} />
        <Stat icon={Wallet} label="Gəlir (30g)" value={formatMoney(stats.revenue_30d)} />
        <Stat
          icon={Clock}
          label="Son giriş"
          value={stats.last_login_at ? String(stats.last_login_at).replace("T", " ").slice(0, 16) : "—"}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <Card padding="none">
          <div className="px-4 pt-3">
            <Tabs
              active={tab}
              onChange={setTab}
              tabs={[
                { id: "overview", label: "Ümumi" },
                { id: "users", label: "İstifadəçilər", badge: data.users?.length },
                { id: "activity", label: "Fəaliyyət", icon: Activity },
                { id: "orders", label: "Sifariş", badge: data.orders?.length },
                { id: "notes", label: "Qeydlər", icon: StickyNote, badge: notes.length },
              ]}
            />
          </div>
          <div className="p-4 sm:p-5">
            {tab === "overview" && (
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Row k="Ad" v={r.name} />
                <Row k="Email" v={r.email} copy />
                <Row k="Telefon" v={r.phone || "—"} />
                <Row k="Ünvan" v={r.address || "—"} />
                <Row k="Valyuta" v={r.currency || "—"} />
                <Row k="Dil" v={r.language || "—"} />
                <Row k="Aktiv" v={r.is_active ? "Bəli" : "Xeyr"} />
                <Row k="Müddət" v={r.active_until ? String(r.active_until).slice(0, 10) : "—"} />
                <Row k="Paket" v={r.package?.name || "—"} />
                <Row
                  k="Telegram Bot"
                  v={r.package?.limits?.telegram_bot ? "Tarifdə aktiv" : "Tarifdə yoxdur"}
                />
                <Row k="Yaradılıb" v={r.created_at ? String(r.created_at).replace("T", " ").slice(0, 16) : "—"} />
                <Row k="Admin" v={data.admin?.name || data.admin?.email || "—"} />
              </dl>
            )}

            {tab === "users" && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr>
                      <th className="text-left py-2 pr-3">Ad</th>
                      <th className="text-left py-2 pr-3">Email</th>
                      <th className="text-left py-2">Rol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
                    {(data.users || []).map((u) => (
                      <tr key={u.id}>
                        <td className="py-2 pr-3 font-medium text-slate-800 dark:text-slate-100">{u.name}</td>
                        <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            {u.email} <Copy value={u.email} />
                          </span>
                        </td>
                        <td className="py-2 text-slate-500">
                          {(Array.isArray(u.roles) ? u.roles : []).join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!data.users?.length && <p className="text-sm text-slate-500">İstifadəçi yoxdur.</p>}
              </div>
            )}

            {tab === "activity" && (
              <ul className="space-y-2">
                {(data.audit || []).map((a) => (
                  <li key={a.id} className="text-sm border-b border-slate-100 dark:border-[#1f2a44] pb-2">
                    <div className="font-medium text-slate-800 dark:text-slate-100">{a.action}</div>
                    <div className="text-xs text-slate-400">
                      {a.created_at ? String(a.created_at).replace("T", " ").slice(0, 19) : ""} · {a.ip || ""}
                    </div>
                  </li>
                ))}
                {!data.audit?.length && <p className="text-sm text-slate-500">Audit qeydi yoxdur.</p>}
              </ul>
            )}

            {tab === "orders" && (
              <ul className="space-y-2">
                {(data.orders || []).map((o) => (
                  <li key={o.id} className="text-sm flex justify-between gap-3 border-b border-slate-100 dark:border-[#1f2a44] pb-2">
                    <span className="text-slate-700 dark:text-slate-200">#{o.id} {o.status || o.state || ""}</span>
                    <span className="text-xs text-slate-400">
                      {o.created_at ? String(o.created_at).replace("T", " ").slice(0, 16) : ""}
                    </span>
                  </li>
                ))}
                {!data.orders?.length && <p className="text-sm text-slate-500">Son sifariş yoxdur.</p>}
              </ul>
            )}

            {tab === "notes" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Daxili qeyd (yalnız super-admin görür)"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#0f1830] border border-slate-200 dark:border-[#1f2a44] rounded-xl text-sm"
                  />
                  <Button variant="primary" icon={Plus} loading={noteBusy} onClick={addNote}>
                    Əlavə et
                  </Button>
                </div>
                <ul className="space-y-2">
                  {notes.map((n) => (
                    <li key={n.id} className="rounded-xl border border-slate-200 dark:border-[#1f2a44] p-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{n.note}</span>
                        <button type="button" className="text-rose-500 text-xs shrink-0" onClick={() => removeNote(n.id)}>
                          Sil
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {n.user?.name || n.user?.email || ""} · {n.created_at ? String(n.created_at).replace("T", " ").slice(0, 16) : ""}
                      </div>
                    </li>
                  ))}
                </ul>
                {!notes.length && <p className="text-sm text-slate-500">Hələ qeyd yoxdur.</p>}
              </div>
            )}
          </div>
        </Card>

        <Card padding="md" className="h-fit">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Metadata</h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-slate-500 text-xs">Status</div>
              <div className="font-medium text-slate-800 dark:text-slate-100">{r.is_active ? "Aktiv" : "Passiv"}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Müddət</div>
              <div className="font-medium text-slate-800 dark:text-slate-100">{r.active_until ? String(r.active_until).slice(0, 10) : "—"}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">QR</div>
              <div className="font-medium text-slate-800 dark:text-slate-100">{r.is_qr_active ? "Açıq" : "Bağlı"}</div>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Admin şifrəsini sıfırla"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setResetOpen(false)}>Ləğv</Button>
            <Button variant="primary" loading={resetBusy} onClick={doReset}>Sıfırla</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input type="password" label="Yeni şifrə" value={resetPw} onChange={(e) => setResetPw(e.target.value)} />
          <Input type="password" label="Sizin super-admin şifrəniz" value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} />
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doDelete}
        variant="danger"
        title={`${r.name} silinsin?`}
        description="Geri qaytarıla bilməz. Bütün istifadəçilər də silinəcək."
        confirmText="Sil"
        requireTyped={r.name}
        requirePassword
      />
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <Card padding="md" className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 grid place-items-center">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
        <div className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{value}</div>
      </div>
    </Card>
  );
}

function Row({ k, v, copy }) {
  return (
    <>
      <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
      <dd className="text-slate-800 dark:text-slate-100 font-medium flex items-center gap-1 min-w-0">
        <span className="truncate">{v || "—"}</span>
        {copy && v && v !== "—" && <Copy value={v} />}
      </dd>
    </>
  );
}
