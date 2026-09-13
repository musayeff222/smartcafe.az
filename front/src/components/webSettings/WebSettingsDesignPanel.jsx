import React from "react";
import { Palette, Save, Loader2, Image } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { storageUrl } from "../../utils/storageUrl";
import { WEB_MENU_TEMPLATES } from "../webMenu/themes";
import { TemplatePreviewMock } from "../webMenu/WebMenuLayouts";
import { useWebSettings } from "./WebSettingsContext";

const WebSettingsDesignPanel = () => {
  const { t } = useLanguage();
  const {
    saving,
    form,
    bannerPreview,
    inputClass,
    labelClass,
    handleChange,
    selectTemplate,
    handleBannerPick,
    removeBanner,
    handleSave,
  } = useWebSettings();

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Design */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Palette size={18} className="text-indigo-600" />
          {t("webSettings.design")}
        </div>

        <div>
          <label className={labelClass}>{t("webSettings.templatePick")}</label>
          <p className="text-[11px] text-slate-500 mb-3">{t("webSettings.templatePickHint")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {WEB_MENU_TEMPLATES.map((tpl) => (
              <TemplatePreviewMock
                key={tpl.id}
                templateId={tpl.id}
                selected={form.theme_template === tpl.id}
                onClick={() => selectTemplate(tpl.id)}
                label={t(`webSettings.template_${tpl.id}`)}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("webSettings.webTitle")}</label>
            <input className={inputClass} name="web_title" value={form.web_title || ""} onChange={handleChange} />
          </div>
          <div>
            <label className={labelClass}>{t("webSettings.webSubtitle")}</label>
            <input className={inputClass} name="web_subtitle" value={form.web_subtitle || ""} onChange={handleChange} />
          </div>
          <div>
            <label className={labelClass}>{t("webSettings.themeColor")}</label>
            <input className="h-11 w-full max-w-[120px] cursor-pointer rounded-lg border" type="color" name="theme_color" value={form.theme_color} onChange={handleChange} />
          </div>
          <div>
            <label className={labelClass}>{t("webSettings.bgColor")}</label>
            <input className="h-11 w-full max-w-[120px] cursor-pointer rounded-lg border" type="color" name="bg_color" value={form.bg_color} onChange={handleChange} />
          </div>
        </div>
        {form.restaurant_logo && (
          <div className="flex items-center gap-3 pt-2">
            <img src={storageUrl(form.restaurant_logo)} alt="" className="w-14 h-14 rounded-full object-cover border" />
            <p className="text-xs text-slate-500">{t("webSettings.logoFromProfile")}</p>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200">
          <label className={labelClass}>{t("webSettings.bannerImage")}</label>
          <p className="text-[11px] text-slate-500 mb-3">{t("webSettings.bannerHint")}</p>
          {(bannerPreview || form.banner_path) && (
            <div className="relative h-36 sm:h-44 rounded-xl overflow-hidden border border-slate-200 mb-3">
              <img
                src={bannerPreview || storageUrl(form.banner_path)}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/40 to-transparent">
                {form.restaurant_logo && (
                  <img
                    src={storageUrl(form.restaurant_logo)}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-lg -mt-8"
                  />
                )}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium cursor-pointer hover:bg-slate-50">
              <Image size={16} className="text-indigo-600" />
              {t("webSettings.bannerUpload")}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg" className="hidden" onChange={handleBannerPick} />
            </label>
            {(form.banner_path || bannerPreview) && (
              <button
                type="button"
                onClick={removeBanner}
                className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50"
              >
                {t("webSettings.bannerRemove")}
              </button>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {t("webSettings.save")}
      </button>
    </form>
  );
};

export default WebSettingsDesignPanel;
