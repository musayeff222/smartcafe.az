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

function EditUserModal({ user, onEditUser, onClose }) {
  const [name, setName] = useState(user.name || "");
  const [admin_name, setAdminName] = useState(user.users?.[0]?.name || "");
  const [admin_email, setAdminEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(!!user.is_active);
  const [expirationDate, setExpirationDate] = useState(
    user.active_until ? user.active_until.slice(0, 10) : ""
  );

  const handleSubmit = () => {
    const updatedUser = {
      id: user.id,
      name,
      admin_name,
      admin_email,
      admin_password: password || user.password,
      is_active: status,
      active_until: expirationDate || null,
    };
    onEditUser(updatedUser);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-4 text-white">
          <h3 className="text-lg font-bold">İstifadəçini Redaktə Et</h3>
          <p className="text-xs text-amber-100 mt-0.5">
            Restoran məlumatlarını yeniləyin
          </p>
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-white/20 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          <Field icon={<Building2 size={16} />} label="Restoran adı">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-mod-edit"
            />
          </Field>

          <Field icon={<User size={16} />} label="Adminin adı">
            <input
              type="text"
              value={admin_name}
              onChange={(e) => setAdminName(e.target.value)}
              className="input-mod-edit"
            />
          </Field>

          <Field icon={<Mail size={16} />} label="Email">
            <input
              type="email"
              value={admin_email}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="input-mod-edit"
            />
          </Field>

          <Field icon={<Lock size={16} />} label="Yeni parol (isteğe bağlı)">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Boş buraxsanız dəyişməyəcək"
              className="input-mod-edit"
            />
          </Field>

          <Field icon={<Calendar size={16} />} label="İstifadə müddəti">
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="input-mod-edit"
            />
          </Field>

          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Aktiv</span>
            </div>
            <button
              type="button"
              onClick={() => setStatus(!status)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                status ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  status ? "translate-x-5" : "translate-x-0.5"
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
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-md transition"
          >
            Yadda saxla
          </button>
        </div>
      </div>

      <style>{`
        .input-mod-edit {
          width: 100%;
          padding: 10px 12px 10px 38px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          transition: all 0.15s;
          outline: none;
        }
        .input-mod-edit:focus {
          background-color: #fff;
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.2);
        }
      `}</style>
    </div>
  );
}

const Field = ({ icon, label, children }) => (
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
  </div>
);

export default EditUserModal;
