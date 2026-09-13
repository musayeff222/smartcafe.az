import React, { useState } from "react";
import axios from "axios";
import { base_url } from "../../api/index";
import { KeyRound, Loader2 } from "lucide-react";

function AdminPassword() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (password !== confirm) {
      setErr("Yeni şifrələr eyni deyil");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.put(
        `${base_url}/admin/change-password`,
        {
          current_password: current,
          password,
          password_confirmation: confirm,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      if (res.data.access_token) {
        localStorage.setItem("admin_token", res.data.access_token);
      }
      setCurrent("");
      setPassword("");
      setConfirm("");
      setMsg("Şifrə dəyişdirildi. Köhnə tokenlər bağlandı.");
    } catch (e2) {
      setErr(e2.response?.data?.message || "Dəyişmədi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-1">
        <KeyRound size={22} className="text-indigo-600" />
        Super-admin şifrəsi
      </h2>
      <p className="text-sm text-slate-500 mb-5">
        Dəyişəndən sonra bütün köhnə girişlər (Postman daxil) bağlanır.
      </p>
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
      >
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Cari şifrə"
          required
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Yeni şifrə (min. 8)"
          required
          minLength={8}
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Yeni şifrə təkrar"
          required
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
        />
        {err && <p className="text-sm text-rose-600">{err}</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Yadda saxla
        </button>
      </form>
    </div>
  );
}

export default AdminPassword;
