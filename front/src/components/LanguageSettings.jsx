import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Languages, Check } from "lucide-react";
import { base_url } from "../api/index";
import { SUPPORTED_LOCALES, normalizeLocale, hasUserLanguageChoice } from "../i18n/localesMeta";
import { useLanguage } from "../i18n/LanguageContext";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
};

const LanguageSettings = () => {
  const { locale, setLocale, t } = useLanguage();
  const [selected, setSelected] = useState(locale);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${base_url}/own-restaurants`,
          getAuthHeaders()
        );
        if (cancelled) return;
        const lang = normalizeLocale(data.language || "az");
        setSelected(lang);
        if (!hasUserLanguageChoice()) {
          setLocale(lang);
        }
      } catch {
        if (!cancelled) {
          toast.error(t("lang.loadError"), { position: "top-center" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${base_url}/own-restaurants/language`,
        { language: selected },
        getAuthHeaders()
      );
      setLocale(selected);
      toast.success(t("lang.saved"), {
        position: "top-center",
        autoClose: 1400,
      });
    } catch {
      toast.error(t("lang.saveError"), { position: "top-center" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white grid place-items-center shadow">
          <Languages size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            {t("lang.settingsTitle")}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("lang.settingsDesc")}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">...</div>
      ) : (
        <div className="p-5 space-y-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {t("lang.current")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SUPPORTED_LOCALES.map((lang) => {
              const isActive = selected === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelected(lang.code)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-indigo-300 bg-indigo-50/80 ring-2 ring-indigo-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-2xl" aria-hidden>
                    {lang.flag}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={`block text-sm font-semibold ${
                        isActive ? "text-indigo-800" : "text-slate-800"
                      }`}
                    >
                      {lang.label}
                    </span>
                    <span className="block text-[11px] text-slate-500 uppercase">
                      {lang.code}
                    </span>
                  </span>
                  {isActive && (
                    <span className="shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white grid place-items-center">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || selected === locale}
              className="min-h-[44px] rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? "..." : t("lang.save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSettings;