import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { base_url } from "../api/index";
import { Helmet } from "react-helmet";
import { pageTitle, APP_NAME } from "../config/branding";
import {
  Mail,
  Loader2,
  ArrowLeft,
  ArrowRight,
  UtensilsCrossed,
  CheckCircle2,
} from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const value = email.trim();
    if (!value) {
      setError("Email tələb olunur.");
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setError("Düzgün email formatı daxil edin.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${base_url}/password/forgot`, { email: value });
    } catch (err) {
      // Cavab nə olursa olsun eyni ümumi mesaj göstərilir (mövcud emailləri sızdırmamaq üçün).
    } finally {
      setLoading(false);
      setDone(true);
      setTimeout(() => navigate("/"), 3000);
    }
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle("Şifrəni unutdum")}</title>
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
              Şifrəni <br />
              <span className="bg-gradient-to-r from-amber-200 to-pink-200 bg-clip-text text-transparent">
                unutdunuz?
              </span>
            </h1>
            <p className="text-white/80 text-base leading-relaxed">
              Narahat olmayın — email ünvanınızı daxil edin, sizə şifrə
              sıfırlama linki göndərəcəyik.
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
                  Hesabınıza bağlı email ünvanı daxil edin
                </p>
              </div>

              {done ? (
                <div className="text-center space-y-4 py-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 grid place-items-center mx-auto">
                    <CheckCircle2 size={28} className="text-emerald-600" />
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Əgər bu e-poçt sistemdə mövcuddursa, şifrə sıfırlama linki
                    emailinizə göndərildi. Zəhmət olmasa gələn qutunuzu (və spam
                    qovluğunu) yoxlayın.
                  </p>
                  <p className="text-xs text-slate-400">
                    Bir neçə saniyə sonra giriş səhifəsinə yönləndiriləcəksiniz…
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    <ArrowLeft size={16} /> Girişə qayıt
                  </Link>
                </div>
              ) : (
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
                        htmlFor="email"
                        className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
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
                          Göndərilir…
                        </>
                      ) : (
                        <>
                          Sıfırlama linki göndər
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

export default ForgotPassword;
