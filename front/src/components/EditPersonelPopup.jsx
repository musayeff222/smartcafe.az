import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { PERMISSION_KEYS, emptyPermissions } from "../utils/personelHelpers";
import { Pencil, X, Shield, Loader2 } from "lucide-react";

function EditPersonelPopup({ personel, onSave, onClose }) {
  const { t } = useLanguage();
  const [name, setName] = useState(personel?.name || "");
  const [email, setEmail] = useState(personel?.email || "");
  const [type, setType] = useState(personel?.type || "");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState(emptyPermissions());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!personel) return;
    setName(personel.name || "");
    setEmail(personel.email || "");
    setType(personel.type || "");
    setPassword("");
    setErrors({});

    if (personel.type === "general" && personel.permissions) {
      const updated = emptyPermissions();
      PERMISSION_KEYS.forEach((key) => {
        updated[key] = personel.permissions.some((p) => p.name === key);
      });
      setPermissions(updated);
    } else {
      setPermissions(emptyPermissions());
    }
  }, [personel]);

  if (!personel) return null;

  const permissionLabel = (key) => t(`personel.perm_${key.replace(/-/g, "_")}`);

  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setPermissions((prev) => ({ ...prev, [name]: checked }));
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = t("personel.errName");
    if (!email.trim() || !/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) newErrors.email = t("personel.errEmailInvalid");
    if (!type) newErrors.type = t("personel.errType");
    if (type === "general" && !Object.values(permissions).some(Boolean)) {
      newErrors.permissions = t("personel.errPermissions");
    }
    if (password && !/^\d{6,}$/.test(password)) newErrors.password = t("personel.errPasswordShort");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const payload = {
      id: personel.id,
      name: name.trim(),
      email: email.trim(),
      role: type,
      ...(password && { password }),
      ...(type === "general" && {
        permissions: Object.keys(permissions).filter((k) => permissions[k]),
      }),
    };

    try {
      await onSave(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (err) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm dark:bg-slate-800 ${
      err ? "border-red-400 ring-1 ring-red-200" : "border-slate-200 dark:border-slate-600"
    }`;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col max-h-full sm:max-h-[92vh] overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Pencil size={18} className="text-indigo-600" />
            {t("personel.editTitle")}
          </h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">{t("personel.fullName")}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass(errors.name)} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">{t("personel.email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass(errors.email)} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">{t("personel.newPassword")}</label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\D/g, ""))}
              className={inputClass(errors.password)}
              placeholder="123456"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            <p className="text-[10px] text-slate-400 mt-1">{t("personel.passwordOptional")}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">{t("personel.type")}</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass(errors.type)}>
              <option value="">{t("personel.selectRole")}</option>
              <option value="general">{t("personel.roleGeneral")}</option>
              <option value="waiter">{t("personel.roleWaiter")}</option>
            </select>
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
          </div>

          {type === "general" && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/30">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-3">
                <Shield size={16} className="text-indigo-600" />
                {t("personel.permissionsTitle")}
              </p>
              <div className="space-y-2">
                {PERMISSION_KEYS.map((key) => (
                  <label key={key} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name={key}
                      checked={permissions[key]}
                      onChange={handlePermissionChange}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{permissionLabel(key)}</span>
                  </label>
                ))}
              </div>
              {errors.permissions && <p className="text-red-500 text-xs mt-2">{errors.permissions}</p>}
            </div>
          )}
        </form>

        <div className="shrink-0 px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium">
            {t("common.close")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default EditPersonelPopup;
