import React from "react";
import { Construction } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

const WebSettingsPlaceholder = ({ titleKey, descKey }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[360px] rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4">
        <Construction size={24} className="text-slate-400" />
      </div>
      <h2 className="text-lg font-bold text-slate-800">{t(titleKey)}</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md">{t(descKey)}</p>
    </div>
  );
};

export default WebSettingsPlaceholder;
