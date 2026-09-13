import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { base_url } from "../../api/index";
import { Bell, Send, Loader2 } from "lucide-react";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

function AdminNotifications() {
  const [searchParams] = useSearchParams();
  const preselect = Number(searchParams.get("restaurant") || 0);
  const [restaurants, setRestaurants] = useState([]);
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [broadcast, setBroadcast] = useState(!preselect);
  const [selected, setSelected] = useState(preselect ? [preselect] : []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const [r, n] = await Promise.all([
      axios.get(`${base_url}/admin-restaurants`, authHeaders()),
      axios.get(`${base_url}/admin/notifications`, authHeaders()),
    ]);
    setRestaurants(Array.isArray(r.data) ? r.data : []);
    setItems(Array.isArray(n.data) ? n.data : []);
  };

  useEffect(() => {
    load().catch(() => setMsg("Məlumat yüklənmədi"));
  }, []);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const send = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await axios.post(
        `${base_url}/admin/notifications`,
        {
          title,
          body,
          broadcast,
          restaurant_ids: broadcast ? [] : selected,
        },
        authHeaders()
      );
      setTitle("");
      setBody("");
      setMsg(`${res.data.sent} restorana göndərildi`);
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Göndərilmədi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Bell size={22} className="text-indigo-600" />
          Bildirişlər
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Tək restorana və ya hamısına eyni anda mesaj göndərin.
        </p>
      </div>

      <form
        onSubmit={send}
        className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Başlıq"
          required
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Mətn"
          required
          rows={4}
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={broadcast}
            onChange={(e) => setBroadcast(e.target.checked)}
          />
          Bütün restoranlara toplu göndər
        </label>

        {!broadcast && (
          <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-3 grid sm:grid-cols-2 gap-2">
            {restaurants.map((r) => (
              <label
                key={r.id}
                className="flex items-center gap-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(r.id)}
                  onChange={() => toggle(r.id)}
                />
                <span className="truncate">
                  {r.name} <span className="text-slate-400">#{r.id}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        {msg && <p className="text-sm text-indigo-700">{msg}</p>}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Göndər
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 font-semibold text-slate-800">
          Göndərilənlər
        </div>
        <div className="divide-y divide-slate-100">
          {items.length === 0 && (
            <p className="p-5 text-sm text-slate-500">Hələ bildiriş yoxdur.</p>
          )}
          {items.map((n) => (
            <div key={n.id} className="px-5 py-3">
              <div className="font-medium text-slate-800">{n.title}</div>
              <div className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">
                {n.body}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {n.targets_count || n.targets?.length || 0} restoran ·{" "}
                {n.created_at ? String(n.created_at).slice(0, 16).replace("T", " ") : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminNotifications;
