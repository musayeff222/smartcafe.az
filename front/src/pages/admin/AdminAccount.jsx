import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { adminGet, adminPut, friendlyError } from "./adminApi";
import Button from "./ui/Button";
import { Card, CardHeader } from "./ui/Card";
import Badge from "./ui/Badge";
import Input, { inputBase } from "./ui/Input";

function strength(pw) {
  return {
    len: pw.length >= 8,
    mixed: /[A-Z]/.test(pw) && /[a-z]/.test(pw),
    num: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

function PasswordField({ label, value, onChange, autoComplete, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <span className="relative block">
        <Lock
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className={`${inputBase} pl-10 pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
          aria-label={show ? "Gizlət" : "Göstər"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  );
}

function Rule({ ok, text }) {
  return (
    <li
      className={`flex items-center gap-1.5 text-xs ${
        ok ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full grid place-items-center ${
          ok ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-white/10"
        }`}
      >
        <Check size={10} />
      </span>
      {text}
    </li>
  );
}

function AdminAccount() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab") === "email" ? "email" : "password";
  const [tab, setTab] = useState(requested);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwDone, setPwDone] = useState(false);

  const [emailPass, setEmailPass] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [savingEm, setSavingEm] = useState(false);
  const [emDone, setEmDone] = useState(false);

  const rules = useMemo(() => strength(password), [password]);
  const score = [rules.len, rules.mixed, rules.num, rules.special].filter(Boolean).length;
  const match = password.length > 0 && password === confirm;
  const canSubmitPw = current && match && rules.len && rules.mixed && rules.num;
  const labels = ["Çox zəif", "Zəif", "Orta", "Yaxşı", "Güclü"];
  const colors = ["bg-slate-200", "bg-rose-400", "bg-amber-400", "bg-lime-500", "bg-emerald-500"];

  useEffect(() => {
    adminGet("/admin/me")
      .then((r) => {
        setMe(r.data);
        setEmail(r.data.email || "");
      })
      .catch((e) => toast.error(friendlyError(e, "Profil yüklənmədi")))
      .finally(() => setLoading(false));
  }, []);

  const switchTab = (id) => {
    setTab(id);
    setSearchParams(id === "email" ? { tab: "email" } : {}, { replace: true });
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!canSubmitPw) return;
    setSavingPw(true);
    try {
      const res = await adminPut("/admin/change-password", {
        current_password: current,
        password,
        password_confirmation: confirm,
      });
      if (res.data.access_token) localStorage.setItem("admin_token", res.data.access_token);
      setCurrent("");
      setPassword("");
      setConfirm("");
      setPwDone(true);
      toast.success("Şifrə dəyişdirildi. Digər sessiyalar bağlandı.");
    } catch (err) {
      toast.error(friendlyError(err, "Şifrə dəyişmədi"));
    } finally {
      setSavingPw(false);
    }
  };

  const saveEmail = async (e) => {
    e.preventDefault();
    setSavingEm(true);
    try {
      const res = await adminPut("/admin/change-email", {
        current_password: emailPass,
        email,
        email_confirmation: emailConfirm,
      });
      if (res.data.access_token) localStorage.setItem("admin_token", res.data.access_token);
      setMe((m) => ({ ...m, email: res.data.email }));
      setEmailPass("");
      setEmailConfirm("");
      setEmDone(true);
      toast.success(res.data.message || "E-mail yeniləndi");
    } catch (err) {
      toast.error(friendlyError(err, "E-mail dəyişmədi"));
    } finally {
      setSavingEm(false);
    }
  };

  const role = me?.roles?.[0] || "super-admin";

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="h-16 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-[#1f2a44] animate-pulse" />
        <div className="h-80 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-[#1f2a44] animate-pulse" />
      </div>
    );
  }

  const passwordCard = (
    <Card padding="lg" className="space-y-4 h-full">
      <CardHeader
        title="Şifrəni dəyiş"
        description="Ən az 8 simvol, böyük/kiçik hərf və rəqəm. Dəyişəndən sonra digər cihazlarda yenidən giriş lazımdır."
      />
      {pwDone && (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" />
          Şifrə yeniləndi. Bu cihazdakı sessiyanız saxlanıldı.
        </div>
      )}
      <form onSubmit={savePassword} className="space-y-4">
        <PasswordField
          label="Cari şifrə"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
          placeholder="İndiki şifrəniz"
        />
        <PasswordField
          label="Yeni şifrə"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setPwDone(false);
          }}
          autoComplete="new-password"
          placeholder="Ən az 8 simvol"
        />
        <div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${colors[score]}`}
              style={{ width: `${score * 25}%` }}
            />
          </div>
          <div className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {password ? labels[score] : "Şifrə gücü"}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-1.5">
            <Rule ok={rules.len} text="8+ simvol" />
            <Rule ok={rules.mixed} text="Böyük və kiçik hərf" />
            <Rule ok={rules.num} text="Rəqəm" />
            <Rule ok={rules.special} text="Xüsusi simvol (tövsiyə)" />
          </ul>
        </div>
        <PasswordField
          label="Yeni şifrəni təkrarlayın"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          placeholder="Eyni şifrə"
        />
        {confirm.length > 0 && (
          <p className={`text-xs ${match ? "text-emerald-600" : "text-rose-500"}`}>
            {match ? "Şifrələr eynidir" : "Şifrələr uyğun gəlmir"}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={savingPw}
          disabled={!canSubmitPw}
          icon={KeyRound}
        >
          Şifrəni yenilə
        </Button>
      </form>
    </Card>
  );

  const emailCard = (
    <Card padding="lg" className="space-y-4 h-full">
      <CardHeader
        title="E-poçtu dəyiş"
        description="Yeni e-mail giriş üçün istifadə olunacaq. Dəyişmək üçün cari şifrə lazımdır."
      />
      {emDone && (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" />
          E-mail yeniləndi.
        </div>
      )}
      <form onSubmit={saveEmail} className="space-y-4">
        <Input
          type="email"
          label="Yeni e-mail"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmDone(false);
          }}
          required
          autoComplete="email"
        />
        <Input
          type="email"
          label="E-mail təkrar"
          value={emailConfirm}
          onChange={(e) => setEmailConfirm(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          type="password"
          label="Cari şifrə"
          value={emailPass}
          onChange={(e) => setEmailPass(e.target.value)}
          required
          autoComplete="current-password"
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={savingEm}
          icon={Mail}
        >
          E-maili dəyiş
        </Button>
      </form>
    </Card>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0b1220] flex flex-col">
      <div className="bg-white dark:bg-[#111a2e] border-b border-slate-200 dark:border-[#1f2a44] px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white grid place-items-center shrink-0 shadow-md font-bold">
              {(me?.name || me?.email || "A").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Hesab və şifrə
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {me?.email || "Super-admin giriş məlumatları"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{role}</Badge>
            {me?.name && <Badge tone="neutral">{me.name}</Badge>}
          </div>
        </div>

        <div className="mt-4 flex gap-1 lg:hidden">
          {[
            { id: "password", label: "Şifrə", icon: KeyRound },
            { id: "email", label: "E-mail", icon: Mail },
          ].map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                  on
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-5">
        <div className="hidden lg:grid lg:grid-cols-2 gap-4 max-w-6xl">
          {passwordCard}
          {emailCard}
        </div>
        <div className="lg:hidden max-w-xl mx-auto">
          {tab === "password" ? passwordCard : emailCard}
        </div>
      </div>
    </div>
  );
}

export default AdminAccount;
