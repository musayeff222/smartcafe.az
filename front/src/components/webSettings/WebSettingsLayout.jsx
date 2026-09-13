import React, { useState } from "react";
import { Globe, Palette, Share2, Ticket, ChevronRight, Loader2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { WebSettingsProvider, useWebSettings } from "./WebSettingsContext";
import WebSettingsGeneralPanel from "./WebSettingsGeneralPanel";
import WebSettingsDesignPanel from "./WebSettingsDesignPanel";
import WebSettingsSocialPanel from "./WebSettingsSocialPanel";
import WebSettingsPromoPanel from "./WebSettingsPromoPanel";

const SECTIONS = [
  { id: "general", labelKey: "webSettings.title", icon: Globe },
  { id: "design", labelKey: "webSettings.design", icon: Palette },
  { id: "social", labelKey: "webSettings.bioLinks", icon: Share2 },
  { id: "promo", labelKey: "webSettings.promoCode", icon: Ticket },
];

const WebSettingsContent = () => {
  const { t } = useLanguage();
  const { loading } = useWebSettings();
  const [activeSection, setActiveSection] = useState(() => {
    try {
      return localStorage.getItem("web_settings_section") || "general";
    } catch (e) {
      return "general";
    }
  });

  const selectSection = (id) => {
    setActiveSection(id);
    try {
      localStorage.setItem("web_settings_section", id);
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[420px] text-slate-500">
        <Loader2 className="animate-spin mr-2" size={20} />
        {t("webSettings.loading")}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)]">
      <aside className="lg:w-64 xl:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/80 lg:sticky lg:top-0 lg:self-start lg:h-[calc(100vh-120px)] lg:overflow-y-auto">
        <div className="px-4 py-4 border-b border-slate-200/70">
          <h3 className="text-base font-bold text-slate-800">{t("webSettings.title")}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{t("webSettings.layoutHint")}</p>
        </div>
        <nav className="p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => selectSection(section.id)}
                className={`group shrink-0 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition border ${
                  isActive
                    ? "bg-white border-indigo-200 shadow-sm"
                    : "border-transparent hover:bg-white/80 hover:border-slate-200"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <div
                  className={`w-10 h-10 shrink-0 rounded-lg grid place-items-center transition ${
                    isActive
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow"
                      : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold truncate ${isActive ? "text-indigo-700" : "text-slate-800"}`}>
                    {t(section.labelKey)}
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className={`hidden lg:block shrink-0 transition ${
                    isActive ? "text-indigo-500 translate-x-0.5" : "text-slate-300 group-hover:text-slate-400"
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto bg-white">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
          {activeSection === "general" && <WebSettingsGeneralPanel />}
          {activeSection === "design" && <WebSettingsDesignPanel />}
          {activeSection === "social" && <WebSettingsSocialPanel />}
          {activeSection === "promo" && <WebSettingsPromoPanel />}
        </div>
      </main>
    </div>
  );
};

const WebSettingsLayout = () => (
  <WebSettingsProvider>
    <WebSettingsContent />
  </WebSettingsProvider>
);

export default WebSettingsLayout;
