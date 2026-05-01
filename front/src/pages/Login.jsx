import React, { useState, useEffect } from "react";
import { pageTitle, APP_NAME } from "../config/branding";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { base_url } from "../api/index";
import { Helmet } from "react-helmet";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  UtensilsCrossed,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  BarChart3,
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redirectToMasalar, setRedirectToMasalar] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setRedirectToMasalar(true);
    }
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email və şifrə tələb olunur");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(`${base_url}/login`, {
        email,
        password,
      });
      localStorage.setItem("token", response.data.access_token);
      if (remember) {
        localStorage.setItem("remembered_email", email);
      } else {
        localStorage.removeItem("remembered_email");
      }
      localStorage.removeItem("booked_table_color");
      localStorage.removeItem("empty_table_color");
      localStorage.removeItem("selectedCustomerId");
      localStorage.removeItem("urunType");
      localStorage.removeItem("masaType");
      setRedirectToMasalar(true);
      window.location.reload();
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Email və ya şifrə yanlışdır");
      } else {
        setError("Giriş baş tutmadı. Yenidən cəhd edin.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (redirectToMasalar) {
    return <Navigate to="/masalar" />;
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle('Login')}</title>
        <meta
          name="description"
          content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi"
        />
      </Helmet>

      <main className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
        <aside className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 text-white p-12 flex-col justify-between">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 -right-32 w-[28rem] h-[28rem] bg-pink-400/20 rounded-full blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "22px 22px",
              }}
            />
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

          <div className="relative z-10 space-y-8 max-w-md">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                Restoranınızı <br />
                <span className="bg-gradient-to-r from-amber-200 to-pink-200 bg-clip-text text-transparent">
                  ağıllı
                </span>{" "}
                idarə edin
              </h1>
              <p className="mt-4 text-white/80 text-base leading-relaxed">
                Masalar, sifarişlər, stok və hesabatlar — hamısı bir yerdə.
                İstənilən cihazdan işləyin.
              </p>
            </div>

            <div className="space-y-3">
              <Feature
                icon={<Smartphone size={18} />}
                title="Mobil uyğun"
                text="Telefon, tablet və masaüstündə eyni rahatlıqla"
              />
              <Feature
                icon={<BarChart3 size={18} />}
                title="Canlı hesabatlar"
                text="Gündəlik kassa və satış analizləri anında"
              />
              <Feature
                icon={<ShieldCheck size={18} />}
                title="Təhlükəsiz"
                text="Məlumatlarınız şifrələnmiş bağlantı ilə qorunur"
              />
            </div>
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
              <div className="text-2xl font-bold text-slate-800">{APP_NAME}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  Xoş gəlmisiniz
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Davam etmək üçün hesabınıza daxil olun
                </p>
              </div>

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

                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide"
                  >
                    Şifrə
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-600">Məni xatırla</span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition group"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Giriş edilir...
                    </>
                  ) : (
                    <>
                      Daxil Ol
                      <ArrowRight
                        size={16}
                        className="group-hover:translate-x-0.5 transition"
                      />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  Hesabınız yoxdur? İş birliyi və demo üçün
                </p>
                <a
                  title="+994 50 424 38 92"
                  target="_blank"
                  rel="noreferrer"
                  href="https://wa.me/+994504243892"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp ilə əlaqə saxlayın
                </a>
              </div>
            </div>

            <p className="lg:hidden text-center text-xs text-slate-400 mt-6">
              © {new Date().getFullYear()} {APP_NAME} · Bütün hüquqlar qorunur
            </p>
          </div>
        </section>
      </main>
    </>
  );
};

const Feature = ({ icon, title, text }) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 shrink-0 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 grid place-items-center">
      {icon}
    </div>
    <div>
      <div className="font-semibold text-white">{title}</div>
      <div className="text-sm text-white/70">{text}</div>
    </div>
  </div>
);

export default Login;
