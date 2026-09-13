import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useUiSettings } from "../context/UiSettingsContext";
import { UI_FEATURES, UI_OPTIONS, UI_PAGES } from "../config/uiSettings";
import { toast } from "react-toastify";
import { Eye, EyeOff, Layout, Loader2, Save, Sparkles } from "lucide-react";

function OptionToggleRow({ title, desc, checked, onChange, disabled }) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
        checked
          ? "border-indigo-200 bg-indigo-50/60 dark:bg-indigo-950/20 dark:border-indigo-800"
          : "border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 opacity-80"
      } ${disabled ? "opacity-50 pointer-events-none" : "hover:border-indigo-200"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</span>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
    </label>
  );
}

function ToggleRow({ icon: Icon, title, desc, checked, onChange, disabled }) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
        checked
          ? "border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800"
          : "border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 opacity-80"
      } ${disabled ? "opacity-50 pointer-events-none" : "hover:border-indigo-200"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className={checked ? "text-emerald-600" : "text-slate-400"} />}
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</span>
          {checked ? (
            <Eye size={14} className="text-emerald-600 ml-auto shrink-0" />
          ) : (
            <EyeOff size={14} className="text-slate-400 ml-auto shrink-0" />
          )}
        </div>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
    </label>
  );
}

export default function AppearanceSettingsTab() {
  const { t } = useLanguage();
  const { settings, loading, updateSettings, refresh } = useUiSettings();
  const [hiddenPages, setHiddenPages] = useState([]);
  const [hiddenFeatures, setHiddenFeatures] = useState([]);
  const [options, setOptions] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHiddenPages(settings.hidden_pages || []);
    setHiddenFeatures(settings.hidden_features || []);
    setOptions(settings.options || {});
  }, [settings]);

  const mainPages = useMemo(() => UI_PAGES.filter((p) => p.group === "main"), []);
  const tanimPages = useMemo(() => UI_PAGES.filter((p) => p.group === "tanim"), []);

  const togglePage = (key, visible) => {
    setHiddenPages((prev) => {
      if (visible) return prev.filter((k) => k !== key);
      return prev.includes(key) ? prev : [...prev, key];
    });
  };

  const toggleFeature = (key, visible) => {
    setHiddenFeatures((prev) => {
      if (visible) return prev.filter((k) => k !== key);
      return prev.includes(key) ? prev : [...prev, key];
    });
  };

  const toggleOption = (key, enabled) => {
    setOptions((prev) => ({ ...prev, [key]: enabled }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        hidden_pages: hiddenPages,
        hidden_features: hiddenFeatures,
        options,
      });
      toast.success(t("settings.appearanceSaved"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("settings.appearanceSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const visibleCount = UI_PAGES.length - hiddenPages.length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 dark:border-indigo-900 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
            <Layout size={22} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t("settings.tabAppearance")}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t("settings.tabAppearanceDesc")}</p>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2 font-medium">
              {visibleCount} / {UI_PAGES.length} {t("settings.pagesVisible")}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
              {t("settings.mainMenuSection")}
            </h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {mainPages.map((page) => (
                <ToggleRow
                  key={page.key}
                  title={t(page.labelKey)}
                  desc={page.path}
                  checked={!hiddenPages.includes(page.key)}
                  onChange={(visible) => togglePage(page.key, visible)}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
              {t("settings.tanimMenuSection")}
            </h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {tanimPages.map((page) => (
                <ToggleRow
                  key={page.key}
                  title={t(page.labelKey)}
                  desc={page.path}
                  checked={!hiddenPages.includes(page.key)}
                  onChange={(visible) => togglePage(page.key, visible)}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              {t("settings.featuresSection")}
            </h3>
            <p className="text-xs text-slate-500">{t("settings.featuresSectionDesc")}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {UI_FEATURES.map((feat) => (
                <ToggleRow
                  key={feat.key}
                  title={t(feat.labelKey)}
                  desc={t(feat.descKey)}
                  checked={!hiddenFeatures.includes(feat.key)}
                  onChange={(visible) => toggleFeature(feat.key, visible)}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
              {t("settings.optionsSection")}
            </h3>
            <p className="text-xs text-slate-500">{t("settings.optionsSectionDesc")}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {UI_OPTIONS.map((opt) => {
                const featureHidden =
                  opt.requiresFeature && hiddenFeatures.includes(opt.requiresFeature);
                return (
                  <OptionToggleRow
                    key={opt.key}
                    title={t(opt.labelKey)}
                    desc={t(opt.descKey)}
                    checked={Boolean(options[opt.key])}
                    onChange={(enabled) => toggleOption(opt.key, enabled)}
                    disabled={featureHidden}
                  />
                );
              })}
            </div>
          </section>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {t("settings.saveChanges")}
            </button>
            <button
              type="button"
              onClick={() => refresh()}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
            >
              {t("masalar.refresh")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
