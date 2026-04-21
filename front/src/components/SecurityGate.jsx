import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  X,
  Lock,
  Delete,
  Package,
  Trash2,
  XCircle,
  Warehouse,
  Wallet,
} from "lucide-react";
import {
  PASSWORD_CATEGORIES,
  getPassword,
  isCategoryEnabled,
  VAULT_LOCKED_SENTINEL,
} from "../utils/securityPasswords";
import { needsVaultUnlock } from "../utils/securityVault";

const CATEGORY_ICONS = {
  azaltma: Package,
  silme: Trash2,
  legv: XCircle,
  anbar: Warehouse,
  kassa: Wallet,
};

/**
 * Modern SecurityGate: kateqoriya əsaslı şifrə modal ekranı.
 * Köhnə ScreenPassword dizaynlarının yerinə gələn ortaq komponent.
 *
 * Props:
 *  - category: "azaltma" | "silme" | "legv" | "anbar" | "kassa"
 *  - onSuccess: şifrə düzgün daxil edildikdə çağırılır
 *  - onClose:   modal bağlanmaq istənildikdə (opsional, yoxdursa düymə göstərilmir)
 *  - title:     başlıq (opsional; default kateqoriyanın label-i)
 *  - autoDismiss: default true — söndürülmüş kateqoriyada dərhal onSuccess çağırılır
 */
const SecurityGate = ({
  category,
  onSuccess,
  onClose,
  title,
  autoDismiss = true,
}) => {
  const [vaultReady, setVaultReady] = useState(() => !needsVaultUnlock());
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  const cat =
    PASSWORD_CATEGORIES.find((c) => c.key === category) || {
      key: category,
      label: title || "Şifrə",
      description: "",
    };
  const Icon = CATEGORY_ICONS[category] || Lock;

  useEffect(() => {
    if (autoDismiss && !isCategoryEnabled(category)) {
      onSuccess?.();
    }
  }, [category, autoDismiss]); // eslint-disable-line

  useEffect(() => {
    if (vaultReady) return;
    const onUnlocked = () => setVaultReady(true);
    window.addEventListener("security-vault-unlocked", onUnlocked);
    window.dispatchEvent(new CustomEvent("security-vault-request-unlock"));
    return () => window.removeEventListener("security-vault-unlocked", onUnlocked);
  }, [vaultReady]);

  useEffect(() => {
    if (vaultReady) inputRef.current?.focus();
  }, [vaultReady]);

  const MAX = 6;

  const handle = (v) => {
    setError("");
    if (v === "clear") setValue("");
    else if (v === "back") setValue(value.slice(0, -1));
    else if (value.length < MAX) setValue(value + v);
  };

  const submit = () => {
    if (value.length < 4) {
      setError("Şifrə ən az 4 rəqəm olmalıdır");
      triggerShake();
      return;
    }
    const expected = getPassword(category);
    if (expected === VAULT_LOCKED_SENTINEL) {
      setError("Əvvəl əsas PIN ilə anbar kilidini açın");
      triggerShake();
      window.dispatchEvent(new CustomEvent("security-vault-request-unlock"));
      setValue("");
      return;
    }
    if (String(value) === String(expected)) {
      toast.success("Təsdiq edildi", {
        position: "top-center",
        autoClose: 800,
      });
      onSuccess?.();
    } else {
      setError("Şifrə yanlışdır");
      triggerShake();
      setValue("");
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  // Kateqoriya söndürülübsə heç bir şey göstərmə
  if (autoDismiss && !isCategoryEnabled(category)) return null;

  if (!vaultReady) {
    return (
      <div className="fixed inset-0 z-[55] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white px-6 py-5 shadow-xl border border-slate-200 text-center max-w-sm">
          <p className="text-sm font-medium text-slate-700">
            Şifrə vault-u açılır…
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Əsas PIN pəncərəsini tamamlayın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 z-[60] animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ${
          shake ? "animate-[shake_0.4s_ease-in-out]" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst: gradient header */}
        <div className="relative px-5 py-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 text-white">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-white/15 backdrop-blur grid place-items-center ring-1 ring-white/20">
              <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-indigo-100">
                Təhlükəsizlik
              </div>
              <h3 className="text-lg font-bold leading-tight">
                {title || cat.label}
              </h3>
              <p className="text-xs text-indigo-100/90 mt-0.5">
                Davam etmək üçün şifrəni daxil edin
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="shrink-0 p-1.5 rounded-lg hover:bg-white/15 transition"
                aria-label="Bağla"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Orta: input + keypad */}
        <div className="p-5 space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={show ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={value}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, MAX);
                setValue(v);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              maxLength={MAX}
              placeholder="••••"
              className={`w-full text-center text-3xl sm:text-4xl font-bold tracking-[0.5em] border-2 rounded-xl py-4 focus:outline-none transition placeholder:text-slate-300 placeholder:tracking-widest ${
                error
                  ? "bg-rose-50 border-rose-300 text-rose-700 focus:border-rose-500"
                  : "bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white"
              }`}
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

          {error && (
            <div className="text-center text-sm font-medium text-rose-600 flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handle(String(n))}
                className="py-3.5 rounded-xl text-xl font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 transition"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handle("clear")}
              className="py-3.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 transition"
            >
              Təmizlə
            </button>
            <button
              type="button"
              onClick={() => handle("0")}
              className="py-3.5 rounded-xl text-xl font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 transition"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handle("back")}
              className="py-3.5 rounded-xl text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 active:scale-95 transition inline-flex items-center justify-center gap-1"
            >
              <Delete size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={value.length < 4}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck size={16} /> Kilidi aç
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};

export default SecurityGate;
