import React, { useState } from "react";
import {
  X,
  Building2,
  User,
  Mail,
  Lock,
  Calendar,
  CheckCircle2,
} from "lucide-react";

function AddUserModal({ onAddUser, onClose }) {
  const [name, setName] = useState("");
  const [admin_email, setAdminEmail] = useState("");
  const [admin_name, setAdminName] = useState("");
  const [admin_password, setAdminPassword] = useState("");
  const [is_active, setIsActive] = useState(true);
  const [active_until, setActiveUntil] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Restoran adı tələb olunur";
    if (!admin_name.trim()) e.admin_name = "Admin adı tələb olunur";
    if (!admin_email.trim()) e.admin_email = "Email tələb olunur";
    else if (!/^\S+@\S+\.\S+$/.test(admin_email))
      e.admin_email = "Email formatı yanlışdır";
    if (!admin_password || admin_password.length < 4)
      e.admin_password = "Parol ən az 4 simvol olmalıdır";
    if (!active_until) e.active_until = "Müddət tələb olunur";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onAddUser({
      name,
      admin_email,
      admin_name,
      admin_password,
      is_active,
      active_until,
    });
    setName("");
    setAdminEmail("");
    setAdminName("");
    setAdminPassword("");
    setIsActive(true);
    setActiveUntil("");
    setErrors({});
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white">
          <h3 className="text-lg font-bold">Yeni İstifadəçi Yarat</h3>
          <p className="text-xs text-indigo-100 mt-0.5">
            Yeni restoran və admin hesabı əlavə edin
          </p>
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-white/20 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          <Field
            icon={<Building2 size={16} />}
            label="Restoran adı"
            error={errors.name}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="məs. SmartCafe Merkez"
              className={inputCls}
            />
          </Field>

          <Field
            icon={<User size={16} />}
            label="Adminin adı"
            error={errors.admin_name}
          >
            <input
              type="text"
              value={admin_name}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="məs. Əli Məmmədov"
              className={inputCls}
            />
          </Field>

          <Field
            icon={<Mail size={16} />}
            label="Email"
            error={errors.admin_email}
          >
            <input
              type="email"
              value={admin_email}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@example.com"
              className={inputCls}
            />
          </Field>

          <Field
            icon={<Lock size={16} />}
            label="Parol"
            error={errors.admin_password}
          >
            <input
              type="password"
              value={admin_password}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </Field>

          <Field
            icon={<Calendar size={16} />}
            label="İstifadə müddəti"
            error={errors.active_until}
          >
            <input
              type="date"
              value={active_until}
              onChange={(e) => setActiveUntil(e.target.value)}
              className={inputCls}
            />
          </Field>

          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Aktiv</span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!is_active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                is_active ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  is_active ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100 transition"
          >
            Bağla
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:shadow-md transition"
          >
            Yarat
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-400 transition";

const Field = ({ icon, label, error, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        {icon}
      </span>
      {children}
    </div>
    {error && (
      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
        {error}
      </p>
    )}
  </div>
);

export default AddUserModal;
