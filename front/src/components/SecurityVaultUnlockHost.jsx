import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff, KeyRound, Lock, X, Delete } from "lucide-react";
import { unlockVault, isWebCryptoSupported } from "../utils/securityVault";

/**
 * Tətbiq səviyyəsində vault kilidini açmaq üçün modal (SecurityGate və s. gözləyəndə).
 */
const SecurityVaultUnlockHost = () => {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
  const inputRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    setPin("");
  }, []);

  useEffect(() => {
    const onRequest = () => setOpen(true);
    window.addEventListener("security-vault-request-unlock", onRequest);
    return () =>
      window.removeEventListener("security-vault-request-unlock", onRequest);
  }, []);

  useEffect(() => {
    if (open) {
      setPin("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const submit = async () => {
    if (!isWebCryptoSupported()) {
      toast.error("Brauzeriniz Web Crypto dəstəkləmir", {
        position: "top-center",
      });
      return;
    }
    const p = pin.replace(/\D/g, "");
    if (p.length < 4) {
      toast.warn("PIN ən az 4 rəqəm olmalıdır", { position: "top-center" });
      return;
    }
    try {
      await unlockVault(p);
      window.dispatchEvent(new Event("security-vault-unlocked"));
      toast.success("Kilid açıldı", { position: "top-center", autoClose: 900 });
      close();
    } catch {
      toast.error("PIN yanlışdır", { position: "top-center" });
      setPin("");
    }
  };

  const key = (v) => {
    if (v === "clear") setPin("");
    else if (v === "back") setPin((s) => s.slice(0, -1));
    else if (pin.length < 8) setPin((s) => s + v);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-unlock-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="px-5 py-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 grid place-items-center shrink-0">
            <KeyRound size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="vault-unlock-title" className="text-lg font-bold">
              Əsas PIN
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Şifrə vault-u AES-256-GCM ilə qorunur. Davam üçün PIN daxil edin.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="p-1.5 rounded-lg hover:bg-white/10 transition shrink-0"
            aria-label="Bağla"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              ref={inputRef}
              type={show ? "text" : "password"}
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="••••"
              className="w-full pl-10 pr-11 py-3.5 rounded-xl border-2 border-slate-200 text-center text-2xl font-bold tracking-[0.35em] focus:border-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              aria-label={show ? "Gizlə" : "Göstər"}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => key(String(n))}
                className="py-3 rounded-xl text-lg font-bold bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => key("clear")}
              className="py-3 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100"
            >
              Təmizlə
            </button>
            <button
              type="button"
              onClick={() => key("0")}
              className="py-3 rounded-xl text-lg font-bold bg-slate-100 hover:bg-slate-200"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => key("back")}
              className="py-3 rounded-xl text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 inline-flex items-center justify-center"
            >
              <Delete size={18} />
            </button>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={pin.replace(/\D/g, "").length < 4}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-45 disabled:cursor-not-allowed transition"
          >
            Kilidi aç
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityVaultUnlockHost;
