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
  LockKeyhole,
  AlertTriangle,
} from "lucide-react";
import {
  PASSWORD_CATEGORIES,
  getAllEnabled,
  getAllPasswords,
  setCategoryEnabled,
  setPassword,
} from "../utils/securityPasswords";
import {
  createVault,
  hasVault,
  needsVaultUnlock,
  readLegacyPasswordsMap,
  hasLegacyPlaintextPasswords,
  lockVaultSession,
  isWebCryptoSupported,
} from "../utils/securityVault";

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

const VaultSetupModal = ({ onClose, initialMerge }) => {
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const MAX = 8;
  const active = step === 1 ? value : confirm;
  const setActive = step === 1 ? setValue : setConfirm;

  const handleDigit = (d) => {
    if (active.length < MAX) setActive(active + d);
  };
  const handleBack = () => setActive(active.slice(0, -1));
  const handleClear = () => setActive("");

  const handleNext = () => {
    if (value.length < 4) {
      toast.warn("PIN ən az 4 rəqəm olmalıdır", { position: "top-center" });
      return;
    }
    setStep(2);
  };

  const handleCreate = async () => {
    if (confirm !== value) {
      toast.error("PIN-lər uyğun gəlmir", { position: "top-center" });
      return;
    }
    try {
      await createVault(value, initialMerge || {});
      window.dispatchEvent(new Event("security-vault-unlocked"));
      toast.success("Vault yaradıldı (AES-256-GCM)", {
        position: "top-center",
        autoClose: 1800,
      });
      onClose();
    } catch (e) {
      toast.error(e?.message || "Xəta", { position: "top-center" });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 z-[65]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
              Əsas PIN
            </div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <LockKeyhole size={20} />
              Vault yaradın
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {step === 1
                ? "4–8 rəqəm. Bu PIN şifrələri brauzerdə şifrələyir."
                : "Təsdiq üçün təkrar daxil edin"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 transition"
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
                  step === 1 ? handleNext() : handleCreate();
                }
              }}
              placeholder="••••"
              className="w-full text-center text-2xl font-bold tracking-[0.35em] bg-slate-50 border-2 border-slate-200 rounded-xl py-4 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
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
                onClick={() => handleDigit(String(n))}
                className="py-3.5 rounded-xl text-xl font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 transition"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 transition"
            >
              Təmizlə
            </button>
            <button
              type="button"
              onClick={() => handleDigit("0")}
              className="py-3.5 rounded-xl text-xl font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 transition"
            >
              0
            </button>
            <button
              type="button"
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
                disabled={value.length < 4}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Davam et
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={confirm.length < 4}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm inline-flex items-center justify-center gap-1.5 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={16} /> Yarad və saxla
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PasswordKeypad = ({ category, onClose, onSaved }) => {
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);
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
    try {
      await setPassword(category.key, value);
      toast.success(`${category.label} — şifrə yeniləndi`, {
        position: "top-center",
        autoClose: 1600,
      });
      onSaved?.();
    } catch (err) {
      toast.error(err?.message || "Xəta baş verdi", {
        position: "top-center",
      });
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
                ? "4-6 rəqəmli yeni şifrə daxil edin"
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
              pattern="[0-9]*"
              autoComplete="off"
              value={active}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, MAX);
                setActive(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  step === 1 ? handleNext() : handleSave();
                }
              }}
              maxLength={MAX}
              placeholder="••••"
              className="w-full text-center text-3xl font-bold tracking-[0.5em] bg-slate-50 border-2 border-slate-200 rounded-xl py-4 focus:outline-none focus:border-indigo-500 focus:bg-white transition placeholder:text-slate-300 placeholder:tracking-widest"
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
                onClick={() => handleDigit(String(n))}
                className="py-3.5 rounded-xl text-xl font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 transition"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 transition"
            >
              Təmizlə
            </button>
            <button
              type="button"
              onClick={() => handleDigit("0")}
              className="py-3.5 rounded-xl text-xl font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 transition"
            >
              0
            </button>
            <button
              type="button"
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
                disabled={value.length < 4}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Davam et
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={confirm.length < 4}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm inline-flex items-center justify-center gap-1.5 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={16} /> Yadda saxla
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SecurityPasswordSettings = () => {
  const [tick, setTick] = useState(0);
  const [editingCategory, setEditingCategory] = useState(null);
  const [vaultSetupOpen, setVaultSetupOpen] = useState(false);
  const [mergeForVault, setMergeForVault] = useState(null);
  const pendingKeypadRef = useRef(null);

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    const onUnlocked = () => {
      const next = pendingKeypadRef.current;
      if (next) {
        setEditingCategory(next);
        pendingKeypadRef.current = null;
      }
    };
    window.addEventListener("security-vault-unlocked", onUnlocked);
    return () => window.removeEventListener("security-vault-unlocked", onUnlocked);
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (
        e.key === "security_passwords" ||
        e.key === "security_passwords_enabled" ||
        e.key === "security_vault_v2"
      ) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const requestEditPassword = (cat) => {
    if (!isWebCryptoSupported()) {
      toast.error("Brauzer Web Crypto (PBKDF2/AES-GCM) dəstəkləmir", {
        position: "top-center",
      });
      return;
    }
    if (!hasVault()) {
      setMergeForVault(readLegacyPasswordsMap());
      pendingKeypadRef.current = cat;
      setVaultSetupOpen(true);
      return;
    }
    if (needsVaultUnlock()) {
      pendingKeypadRef.current = cat;
      window.dispatchEvent(new CustomEvent("security-vault-request-unlock"));
      return;
    }
    setEditingCategory(cat);
  };

  const openMigrateOnly = () => {
    if (!isWebCryptoSupported()) {
      toast.error("Brauzer Web Crypto dəstəkləmir", { position: "top-center" });
      return;
    }
    setMergeForVault(readLegacyPasswordsMap());
    pendingKeypadRef.current = null;
    setVaultSetupOpen(true);
  };

  const passwords = getAllPasswords();
  const enabled = getAllEnabled();
  const showLegacyBanner = hasLegacyPlaintextPasswords() && !hasVault();
  const showUnlockBanner = hasVault() && needsVaultUnlock();

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
            Bölmə şifrələri AES-256-GCM ilə əsas PIN altında şifrələnir (Web
            Crypto). Açıq/bağlı vəziyyətlər hələ də bu brauzerdə saxlanılır.
          </p>
        </div>
        {hasVault() && (
          <button
            type="button"
            onClick={() => {
              lockVaultSession();
              toast.info("Vault sessiyası bağlandı", {
                position: "top-center",
                autoClose: 1400,
              });
              refresh();
            }}
            className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            Sessiyanı kilidlə
          </button>
        )}
      </div>

      {showLegacyBanner && (
        <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <AlertTriangle
            className="text-amber-600 shrink-0"
            size={22}
            aria-hidden
          />
          <div className="min-w-0 flex-1 text-sm text-amber-950">
            <p className="font-semibold">Köhnə açıq saxlama aşkarlandı</p>
            <p className="text-xs text-amber-800/90 mt-0.5">
              Şifrələri brauzerdə güclü şifrələməyə keçin (əsas PIN təyin
              edin).
            </p>
          </div>
          <button
            type="button"
            onClick={openMigrateOnly}
            className="shrink-0 px-3 py-2 rounded-lg bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 transition"
          >
            İndi şifrələ
          </button>
        </div>
      )}

      {showUnlockBanner && (
        <div className="mx-4 mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <Lock className="text-indigo-600 shrink-0" size={20} />
          <p className="text-sm text-indigo-950 flex-1">
            Şifrələri redaktə etmək üçün əsas PIN ilə kilidi açın.
          </p>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("security-vault-request-unlock")
              )
            }
            className="shrink-0 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
          >
            Kilidi aç
          </button>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {PASSWORD_CATEGORIES.map((cat) => {
          const isEnabled = enabled[cat.key] !== false;
          const hasCustom = !!passwords[cat.key];

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

              <div className="flex items-center gap-3 sm:gap-4 sm:justify-end shrink-0">
                <Switch
                  checked={isEnabled}
                  onChange={() => {
                    setCategoryEnabled(cat.key, !isEnabled);
                    refresh();
                  }}
                  ariaLabel={`${cat.label} aktiv/bağlı`}
                />
                <button
                  type="button"
                  onClick={() => requestEditPassword(cat)}
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

      <div className="px-4 sm:px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-2">
        <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-700">Təhlükəsizlik:</span>{" "}
          Kateqoriya şifrələri{" "}
          <abbr title="Advanced Encryption Standard" className="no-underline">
            AES-256-GCM
          </abbr>{" "}
          ilə şifrələnir; əsas PIN{" "}
          <abbr title="Password-Based Key Derivation Function 2" className="no-underline">
            PBKDF2
          </abbr>{" "}
          (210 min iterasiya, SHA-256) ilə açara çevrilir. PIN brauzeri bağlayana
          və ya səhifəni yeniləyənə qədər yadda saxlanılır; vault faylında yalnız
          duz və şifrəli mətn saxlanır.
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          XSS, zərərli əlavə və ya cihaza fiziki giriş halında hər hansı yalnız
          front-end həll tam müdafiə vermir. İstehsal (prod) mühitində şifrələri
          serverdə saxlamaq və{" "}
          <span className="whitespace-nowrap">HTTPS</span> istifadə etmək
          tövsiyə olunur.
        </p>
      </div>

      {vaultSetupOpen && (
        <VaultSetupModal
          initialMerge={mergeForVault || {}}
          onClose={() => {
            setVaultSetupOpen(false);
            pendingKeypadRef.current = null;
            setMergeForVault(null);
          }}
        />
      )}

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
