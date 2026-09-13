import React from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Globe,
  Link2,
  Copy,
  ExternalLink,
  Save,
  Loader2,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useWebSettings } from "./WebSettingsContext";

const WebSettingsGeneralPanel = () => {
  const { t } = useLanguage();
  const {
    saving,
    form,
    publicUrl,
    domainStatusLabel,
    cnameTarget,
    serverIp,
    inputClass,
    labelClass,
    handleChange,
    copyLink,
    handleSave,
  } = useWebSettings();

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">{t("webSettings.title")}</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">{t("webSettings.intro")}</p>
      </div>

      {/* Public link + QR */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Globe size={18} className="text-indigo-600" />
          {t("webSettings.publicLink")}
        </div>
        <p className="text-xs text-slate-600">{t("webSettings.publicLinkHint")}</p>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
            {publicUrl && <QRCodeSVG value={publicUrl} size={120} level="M" />}
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <label className={labelClass}>{t("webSettings.slug")}</label>
              <input
                className={inputClass}
                name="slug"
                value={form.slug}
                onChange={handleChange}
                pattern="[a-z0-9-]+"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">{t("webSettings.slugHint")}</p>
            </div>
            <div className="flex gap-2">
              <input className={inputClass + " flex-1 bg-slate-50"} readOnly value={publicUrl} />
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                <Copy size={14} />
                {t("webSettings.copy")}
              </button>
            </div>
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
              >
                <ExternalLink size={14} />
                {t("webSettings.preview")}
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <span className="text-sm text-slate-700">{t("webSettings.menuActive")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="accept_orders"
              checked={form.accept_orders}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <span className="text-sm text-slate-700">{t("webSettings.acceptOrders")}</span>
          </label>
        </div>
      </div>

      {/* Custom domain */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Link2 size={18} className="text-indigo-600" />
          {t("webSettings.customDomain")}
        </div>
        <p className="text-xs text-slate-600">{t("webSettings.customDomainIntro")}</p>
        <div>
          <label className={labelClass}>{t("webSettings.domainField")}</label>
          <input
            className={inputClass}
            name="custom_domain"
            value={form.custom_domain || ""}
            onChange={handleChange}
            placeholder="menu.restoraniniz.az"
            disabled={form.domain_status === "active"}
          />
          {form.domain_status === "active" && (
            <p className="text-[11px] text-slate-500 mt-1">{t("webSettings.domainActiveLocked")}</p>
          )}
          {form.domain_status && form.domain_status !== "none" && (
            <span
              className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                form.domain_status === "active"
                  ? "bg-green-100 text-green-800"
                  : form.domain_status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {domainStatusLabel[form.domain_status] || form.domain_status}
            </span>
          )}
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-3 text-xs text-slate-600 space-y-2">
          <p className="font-medium text-slate-800">{t("webSettings.dnsTitle")}</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>{t("webSettings.dnsStep1", { cname: cnameTarget })}</li>
            <li>{t("webSettings.dnsStep2", { ip: serverIp })}</li>
            <li>{t("webSettings.dnsStep3")}</li>
          </ol>
          {form.domain_status === "pending" && (
            <p className="text-amber-700 pt-1">{t("webSettings.dnsPendingHint")}</p>
          )}
          {form.domain_status === "active" && (
            <p className="text-green-700 pt-1">{t("webSettings.dnsActiveHint", { domain: form.custom_domain })}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>{t("webSettings.domainNote")}</label>
          <textarea
            className={inputClass}
            name="domain_note"
            rows={2}
            value={form.domain_note || ""}
            onChange={handleChange}
            placeholder={t("webSettings.domainNotePlaceholder")}
          />
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

export default WebSettingsGeneralPanel;
