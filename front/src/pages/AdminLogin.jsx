import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { base_url } from "../api/index";
import { Helmet } from "react-helmet";
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    if (!email || !password) {
      setError("Email və parol tələb olunur");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(`${base_url}/login`, {
        email,
        password,
      });
      if (response.data && response.data.access_token) {
        localStorage.setItem("admin_token", response.data.access_token);
        navigate("/adminPage/dashboard");
      } else {
        setError("Email və ya parol yanlışdır");
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Email və ya parol yanlışdır");
      } else {
        setError("Xəta baş verdi. Yenidən cəhd edin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Super Admin Giriş | Smartcafe</title>
        <meta
          name="description"
          content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi"
        />
      </Helmet>

      <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <form
          onSubmit={handleLogin}
          className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white shadow-md">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Admin Giriş</h2>
              <p className="text-xs text-slate-500">
                Smartcafe Super Admin Panel
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Parol
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Giriş edilir..." : "Daxil ol"}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Smartcafe · Bütün hüquqlar qorunur
            </p>
          </div>
        </form>
      </div>
    </>
  );
}

export default AdminLogin;
