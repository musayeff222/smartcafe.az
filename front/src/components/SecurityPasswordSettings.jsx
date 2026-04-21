/**
 * POS təhlükəsizlik şifrələri — serverdə (MySQL) bcrypt; idarəetmə manage-restaurants icazəsi ilə.
 */
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  X,
  Check,
  Delete,
  Lock,
  RotateCcw,
} from "lucide-react";
import {
  PASSWORD_CATEGORIES,
  getAllEnabled,
  getAllPasswords,
  setCategoryEnabled,
  setPassword,
  refreshSecuritySettings,
  resetCustomPin,
  hasCustomPinFor,
} from "../utils/securityPasswords";

const Switch = ({ checked, onChange, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
      checked ? "bg-indigo-600" : "bg-slate-300"
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-5" : "translate-x-0.5"
      }`}
    />
  </button>
);

const PasswordKeypad = ({ category, onClose, onSaved }) => {
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const MAX = 6;

  const active = step === 1 ? value : confirm;
  const setActive = step === 1 ? setValue : setConfirm;

  const handleDigit = (d) => {
    if (active.length < MAX) setActive(active + d);
  };
  const handleBack = () => setActive(active.slice(0, -1));
  const handleClear = () => setActive("");

  const handleNext = () => {
    if (value.length < 4) {
      toast.warn("Şifrə ən az 4 rəqəm olmalıdır", { position: "top-center" });
      return;
    }
    setStep(2);
  };

  const handleSave = async () => {
    if (confirm !== value) {
      toast.error("Şifrələr uyğun gəlmir", { position: "top-center" });
      return;
    }
    setSaving(true);
    try {
      await setPassword(category.key, value);
      toast.success(`${category.label} — serverdə yeniləndi`, {
        position: "top-center",
        autoClose: 1600,
      });
      onSaved?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Xəta", {
        position: "top-center",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
              Yeni şifrə
            </div>
            <h3 className="text-lg font-bold">{category.label}</h3>
            <p className="text-xs text-indigo-100 mt-0.5">
              {step === 1
                ? "4-6 rəqəm — serverdə təhlükəsiz saxlanacaq"
                : "Təsdiq üçün təkrar daxil edin"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition"
            aria-label="Bağla"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={show ? "text" : "password"}
              inputMode="numeric"
              autoComplete="off"
              value={active}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, MAX);
                setActive(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!saving) step === 1 ? handleNext() : handleSave();
                }
              }}
              disabled={saving}
              placeholder="••••"
              className="w-full text-center text-3xl font-bold tracking-[0.5em] bg-slate-50 border-2 border-slate-200 rounded-xl py-4 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label={show ? "Gizlə" : "Göstər"}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                disabled={saving}
                onClick={() => handleDigit(String(n))}
                className="py-3.5 rounded-xl text-xl font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 transition disabled:opacity-50"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={saving}
              onClick={handleClear}
              className="py-3.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 transition"
            >
              Təmizlə
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleDigit("0")}
              className="py-3.5 rounded-xl text-xl font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 transition"
            >
              0
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleBack}
              className="py-3.5 rounded-xl text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 active:scale-95 transition inline-flex items-center justify-center gap-1"
            >
              <Delete size={16} />
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            {step === 2 && (
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setStep(1);
                  setConfirm("");
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition"
              >
                Geri
              </button>
            )}
            {step === 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={value.length < 4 || saving}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Davam et
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={confirm.length < 4 || saving}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm inline-flex items-center justify-center gap-1.5 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={16} />{" "}
                {saving ? "Saxlanır…" : "Yadda saxla"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SecurityPasswordSettings = () => {
  const [, bump] = useState(0);
  const [editingCategory, setEditingCategory] = useState(null);
  const [listLoading, setListLoading] = useState(true);

  const refresh = () => bump((v) => v + 1);

  const load = async () => {
    setListLoading(true);
    try {
      await refreshSecuritySettings();
    } catch {
      toast.error("Tənzimləmələri yükləmək alınmadı", {
        position: "top-center",
      });
    } finally {
      setListLoading(false);
      refresh();
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onUpd = () => refresh();
    window.addEventListener("security-settings-updated", onUpd);
    return () => window.removeEventListener("security-settings-updated", onUpd);
  }, []);

  const passwords = getAllPasswords();
  const enabled = getAllEnabled();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white grid place-items-center shadow">
          <ShieldCheck size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            Şifrə Nizamlaması
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pin kodları restoranınız üçün MySQL-də{" "}
            <span className="font-medium text-slate-600">bcrypt</span> hash kimi
            saxlanır; bütün cihazlar eyni qaydaları görür.
          </p>
        </div>
      </div>

      {listLoading ? (
        <div className="px-5 py-12 text-center text-sm text-slate-500">
          Yüklənir…
        </div>
      ) : (
      <div className="divide-y divide-slate-100">
        {PASSWORD_CATEGORIES.map((cat) => {
          const isEnabled = enabled[cat.key] !== false;
          const hasCustom =
            hasCustomPinFor(cat.key) || !!passwords[cat.key];

          return (
            <div
              key={cat.key}
              className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
            >
              <div className="flex-1 min-w-0 flex items-start gap-3">
                <div
                  className={`w-9 h-9 shrink-0 rounded-lg grid place-items-center ${
                    isEnabled
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Lock size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-semibold text-slate-800">
                      {cat.label}
                    </span>
                    {hasCustom ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Özəl
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                        Default
                      </span>
                    )}
                    {!isEnabled && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        Söndürülüb
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end shrink-0">
                <Switch
                  checked={isEnabled}
                  onChange={async () => {
                    try {
                      await setCategoryEnabled(cat.key, !isEnabled);
                      refresh();
                    } catch (e) {
                      toast.error(
                        e?.response?.data?.message || "Yeniləmə alınmadı",
                        { position: "top-center" }
                      );
                    }
                  }}
                  ariaLabel={`${cat.label} aktiv/bağlı`}
                />
                {hasCustom && isEnabled && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await resetCustomPin(cat.key);
                        toast.info("Sistem default pin-ə qayıtdı", {
                          position: "top-center",
                        });
                        refresh();
                      } catch (e) {
                        toast.error(
                          e?.response?.data?.message || "Xəta",
                          { position: "top-center" }
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                  >
                    <RotateCcw size={14} /> Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingCategory(cat)}
                  disabled={!isEnabled}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-xs sm:text-sm font-semibold transition"
                >
                  <KeyRound size={14} />
                  Şifrəni təyin et
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <div className="px-4 sm:px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-2">
        <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-700">Server:</span> Hər
          kateqoriya üçün pin{" "}
          <abbr title="bcrypt" className="no-underline">
            bcrypt
          </abbr>{" "}
          ilə hash edilərək{" "}
          <code className="text-[10px] bg-slate-200/80 px-1 rounded">
            restaurant_security_settings
          </code>{" "}
          cədvəlində saxlanır. Düz mətn yalnız HTTPS üzərindən təyin anında
          göndərilir.
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Şifrələri dəyişmək üçün{" "}
          <span className="font-medium">manage-restaurants</span> icazəsi
          lazımdır. POS-da yoxlama bütün işçilər üçün API ilə aparılır.
        </p>
      </div>

      {editingCategory && (
        <PasswordKeypad
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={() => {
            setEditingCategory(null);
            refresh();
          }}
        />
      )}
    </div>
  );
};

export default SecurityPasswordSettings;
