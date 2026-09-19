import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { base_url } from "../api/index";
import { Helmet } from "react-helmet";
import { pageTitle, APP_NAME } from "../config/branding";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  ArrowRight,
  UtensilsCrossed,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(null); // null | true | false
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token || !email) {
      setTokenValid(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${base_url}/password/reset/validate`, {
          params: { email, token },
        });
        if (!cancelled) setTokenValid(!!res?.data?.valid);
      } catch (_) {
        if (!cancelled) setTokenValid(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirm) {
      setError("Yeni şifrə tələb olunur.");
      return;
    }
    if (password.length < 8) {
      setError("Şifrə ən azı 8 simvol olmalıdır.");
      return;
    }
    if (password !== confirm) {
      setError("Şifrələr uyğun gəlmir.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${base_url}/password/reset`, {
        email,
        token,
        password,
        password_confirmation: confirm,
      });
      setDone(true);
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      if (err?.response?.status === 422 && err.response.data?.errors) {
        const first = Object.values(err.response.data.errors)[0];
        setError(Array.isArray(first) ? first[0] : String(first));
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Şifrə yenilənmədi. Yenidən cəhd edin.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInvalid = () => (
    <div className="text-center space-y-4 py-6">
      <div className="w-14 h-14 rounded-full bg-amber-50 grid place-items-center mx-auto">
        <AlertTriangle size={28} className="text-amber-600" />
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">
        Bu link etibarsız və ya vaxtı keçib. Zəhmət olmasa yeni şifrə sıfırlama
        linki tələb edin.
      </p>
      <div className="flex flex-col gap-2">
        <Link
          to="/forgot-password"
          className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition"
        >
          Yeni link tələb et <ArrowRight size={16} />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} /> Girişə qayıt
        </Link>
      </div>
    </div>
  );

  const renderDone = () => (
    <div className="text-center space-y-4 py-6">
      <div className="w-14 h-14 rounded-full bg-emerald-50 grid place-items-center mx-auto">
        <CheckCircle2 size={28} className="text-emerald-600" />
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">
        Şifrəniz uğurla yeniləndi. İndi yeni şifrənizlə daxil ola bilərsiniz.
      </p>
      <p className="text-xs text-slate-400">
        Bir neçə saniyə sonra giriş səhifəsinə yönləndiriləcəksiniz…
      </p>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{pageTitle("Şifrəni sıfırla")}</title>
      </Helmet>

      <main className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
        <aside className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 text-white p-12 flex-col justify-between">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 -right-32 w-[28rem] h-[28rem] bg-pink-400/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md grid place-items-center border border-white/20">
              <UtensilsCrossed size={24} />
            </div>
            <div>
              <div className="text-xl font-bold leading-tight">{APP_NAME}</div>
              <div className="text-xs text-white/70">
                Restoran idarəetmə sistemi
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-4 max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              Yeni <br />
              <span className="bg-gradient-to-r from-amber-200 to-pink-200 bg-clip-text text-transparent">
                şifrə təyin edin
              </span>
            </h1>
            <p className="text-white/80 text-base leading-relaxed">
              Güclü şifrə seçin: ən azı 8 simvol, hərflər və rəqəmlərin
              qarışığı.
            </p>
          </div>

          <div className="relative z-10 text-xs text-white/60">
            © {new Date().getFullYear()} {APP_NAME} · Bütün hüquqlar qorunur
          </div>
        </aside>

        <section className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 grid place-items-center text-white shadow-md">
                <UtensilsCrossed size={22} />
              </div>
              <div className="text-2xl font-bold text-slate-800">
                {APP_NAME}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  Şifrəni sıfırla
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {email ? (
                    <>
                      Hesab: <strong className="text-slate-700">{email}</strong>
                    </>
                  ) : (
                    "Yeni şifrənizi təyin edin"
                  )}
                </p>
              </div>

              {tokenValid === null && !done && (
                <div className="text-center py-8 text-sm text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Link yoxlanılır…
                </div>
              )}

              {tokenValid === false && !done && renderInvalid()}

              {done && renderDone()}

              {tokenValid === true && !done && (
                <>
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide"
                      >
                        Yeni şifrə
                      </label>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          id="password"
                          name="password"
                          type={show ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          minLength={8}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Ən azı 8 simvol"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShow((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                          aria-label={show ? "Şifrəni gizlət" : "Şifrəni göstər"}
                        >
                          {show ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="password_confirmation"
                        className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide"
                      >
                        Şifrəni təsdiqlə
                      </label>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          id="password_confirmation"
                          name="password_confirmation"
                          type={showConfirm ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          minLength={8}
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          placeholder="Şifrəni bir daha daxil edin"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                          aria-label={
                            showConfirm ? "Şifrəni gizlət" : "Şifrəni göstər"
                          }
                        >
                          {showConfirm ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition group"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Yenilənir…
                        </>
                      ) : (
                        <>
                          Şifrəni yenilə
                          <ArrowRight
                            size={16}
                            className="group-hover:translate-x-0.5 transition"
                          />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                    <Link
                      to="/"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <ArrowLeft size={16} /> Girişə qayıt
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ResetPassword;
