import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Boxes, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { adminDelete, adminGet, adminPost, adminPut, friendlyError } from "./adminApi";

const empty = {
  name: "",
  description: "",
  price: 0,
  old_price: "",
  discount_percent: "",
  badge: "",
  color: "#4f46e5",
  cta_text: "Seç",
  cta_url: "",
  features: "",
  user_limit: "",
  storage_limit_mb: "",
  product_limit: "",
  staff_limit: "",
  order_limit: "",
  monthly_price: "",
  yearly_price: "",
  duration_days: 30,
  trial_days: 0,
  is_active: true,
  telegram_bot: false,
};

function AdminPackages() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () =>
    adminGet("/admin/packages")
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch((e) => toast.error(friendlyError(e, "Paketlər yüklənmədi")));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price || 0),
      old_price: form.old_price === "" ? null : Number(form.old_price),
      discount_percent: form.discount_percent === "" ? null : Number(form.discount_percent),
      monthly_price: form.monthly_price === "" ? null : Number(form.monthly_price),
      yearly_price: form.yearly_price === "" ? null : Number(form.yearly_price),
      features: String(form.features || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      limits: {
        user_limit: form.user_limit === "" ? null : Number(form.user_limit),
        storage_limit_mb: form.storage_limit_mb === "" ? null : Number(form.storage_limit_mb),
        product_limit: form.product_limit === "" ? null : Number(form.product_limit),
        staff_limit: form.staff_limit === "" ? null : Number(form.staff_limit),
        order_limit: form.order_limit === "" ? null : Number(form.order_limit),
        telegram_bot: !!form.telegram_bot,
      },
    };
    try {
      if (editing) await adminPut(`/admin/packages/${editing}`, payload);
      else await adminPost("/admin/packages", payload);
      toast.success("Paket yadda saxlandı");
      setOpen(false);
      setEditing(null);
      setForm(empty);
      await load();
    } catch (err) {
      toast.error(friendlyError(err, "Saxlanmadı"));
    } finally {
      setSaving(false);
    }
  };

  const edit = (p) => {
    setEditing(p.id);
    setForm({
      ...empty,
      ...p,
      old_price: p.old_price ?? "",
      features: Array.isArray(p.features) ? p.features.join("\n") : "",
      user_limit: p.limits?.user_limit ?? "",
      storage_limit_mb: p.limits?.storage_limit_mb ?? "",
      product_limit: p.limits?.product_limit ?? "",
      staff_limit: p.limits?.staff_limit ?? "",
      order_limit: p.limits?.order_limit ?? "",
      telegram_bot: !!p.limits?.telegram_bot,
    });
    setOpen(true);
  };

  const remove = async (p) => {
    if (!window.confirm(`${p.name} silinsin?`)) return;
    try {
      await adminDelete(`/admin/packages/${p.id}`);
      toast.success("Silindi");
      await load();
    } catch (e) {
      toast.error(friendlyError(e, "Silinmədi"));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Boxes size={22} className="text-indigo-600" /> Paketlər
        </h2>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm(empty);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm"
        >
          <Plus size={16} /> Yeni paket
        </button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border p-8 text-center text-slate-500">
            Hələ paket yoxdur.
          </div>
        )}
        {items.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-slate-800">{p.name}</div>
                <div className="text-indigo-600 font-semibold mt-1">{p.price} ₼</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {p.is_active ? "Aktiv" : "Deaktiv"}
              </span>
            </div>
            {p.limits?.telegram_bot && (
              <div className="mt-2 text-xs font-medium text-indigo-600">Telegram Bot aktivdir</div>
            )}
            <p className="text-sm text-slate-500 mt-2 line-clamp-3">{p.description}</p>
            <ul className="mt-3 text-sm text-slate-600 space-y-1">
              {(p.features || []).slice(0, 4).map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => edit(p)} className="px-3 py-1.5 rounded-lg border text-sm inline-flex items-center gap-1">
                <Pencil size={14} /> Edit
              </button>
              <button type="button" onClick={() => remove(p)} className="px-3 py-1.5 rounded-lg border text-sm text-rose-600 inline-flex items-center gap-1">
                <Trash2 size={14} /> Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl max-w-2xl mx-auto my-8 p-5 space-y-3">
            <h3 className="font-bold text-slate-800">{editing ? "Paketi redaktə et" : "Yeni paket"}</h3>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ad" className="w-full px-3 py-2 border rounded-xl" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Açıqlama" className="w-full px-3 py-2 border rounded-xl" />
            <div className="grid sm:grid-cols-3 gap-2">
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Qiymət" className="px-3 py-2 border rounded-xl" />
              <input type="number" value={form.old_price} onChange={(e) => setForm({ ...form, old_price: e.target.value })} placeholder="Köhnə qiymət" className="px-3 py-2 border rounded-xl" />
              <input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} placeholder="Endirim %" className="px-3 py-2 border rounded-xl" />
            </div>
            <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Xüsusiyyətlər (hər sətir bir ədəd)" rows={4} className="w-full px-3 py-2 border rounded-xl" />
            <div className="grid sm:grid-cols-2 gap-2">
              <input type="number" value={form.user_limit} onChange={(e) => setForm({ ...form, user_limit: e.target.value })} placeholder="User limit" className="px-3 py-2 border rounded-xl" />
              <input type="number" value={form.staff_limit} onChange={(e) => setForm({ ...form, staff_limit: e.target.value })} placeholder="Staff limit" className="px-3 py-2 border rounded-xl" />
              <input type="number" value={form.product_limit} onChange={(e) => setForm({ ...form, product_limit: e.target.value })} placeholder="Product limit" className="px-3 py-2 border rounded-xl" />
              <input type="number" value={form.order_limit} onChange={(e) => setForm({ ...form, order_limit: e.target.value })} placeholder="Order limit" className="px-3 py-2 border rounded-xl" />
              <input type="number" value={form.storage_limit_mb} onChange={(e) => setForm({ ...form, storage_limit_mb: e.target.value })} placeholder="Storage MB" className="px-3 py-2 border rounded-xl" />
              <input type="number" value={form.trial_days} onChange={(e) => setForm({ ...form, trial_days: e.target.value })} placeholder="Trial days" className="px-3 py-2 border rounded-xl" />
              <input type="number" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} placeholder="Aylıq qiymət" className="px-3 py-2 border rounded-xl" />
              <input type="number" value={form.yearly_price} onChange={(e) => setForm({ ...form, yearly_price: e.target.value })} placeholder="İllik qiymət" className="px-3 py-2 border rounded-xl" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.telegram_bot} onChange={(e) => setForm({ ...form, telegram_bot: e.target.checked })} />
              Telegram Bot
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Aktiv
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 border rounded-xl text-sm">Bağla</button>
              <button disabled={saving} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm inline-flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Saxla
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminPackages;
