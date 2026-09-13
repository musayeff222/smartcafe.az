import React from "react";
import { Globe, Instagram, Save, Loader2, MapPin } from "lucide-react";
import { WhatsAppIcon, TikTokIcon } from "../webMenu/WebMenuSocialIcons";
import { useLanguage } from "../../i18n/LanguageContext";
import { useWebSettings } from "./WebSettingsContext";

const WebSettingsSocialPanel = () => {
  const { t } = useLanguage();
  const { saving, form, inputClass, labelClass, handleChange, handleSave } = useWebSettings();

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Bio links — konum, TikTok, WhatsApp */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Globe size={18} className="text-indigo-600" />
          {t("webSettings.bioLinks")}
        </div>
        <p className="text-xs text-slate-500">{t("webSettings.bioLinksHint")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-red-500" /> {t("webSettings.locationUrl")}</span>
            </label>
            <input className={inputClass} name="location_url" value={form.location_url || ""} onChange={handleChange} placeholder="https://maps.google.com/... və ya Google Maps paylaş linki" />
          </div>
          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1.5"><Instagram size={14} /> Instagram</span>
            </label>
            <input className={inputClass} name="instagram_url" value={form.instagram_url || ""} onChange={handleChange} placeholder="https://instagram.com/..." />
          </div>
          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1.5"><TikTokIcon size={14} /> TikTok</span>
            </label>
            <input className={inputClass} name="tiktok_url" value={form.tiktok_url || ""} onChange={handleChange} placeholder="https://tiktok.com/@..." />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1.5"><WhatsAppIcon size={14} className="text-[#25D366]" /> WhatsApp</span>
            </label>
            <input className={inputClass} name="whatsapp" value={form.whatsapp || ""} onChange={handleChange} placeholder="994501234567 (ölkə kodu ilə)" />
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

export default WebSettingsSocialPanel;
