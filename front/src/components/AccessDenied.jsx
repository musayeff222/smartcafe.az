import React from "react";
import nida from "../img/nida.png";
import { useLanguage } from "../i18n/LanguageContext";

const AccessDenied = ({ onClose }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-red-500 bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative">
        <button
          type="button"
          onClick={() => onClose(false)}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
        >
          ×
        </button>
        <div className="text-center mb-4">
          <img src={nida} alt="" className="w-16 h-16 mx-auto mb-4" />
        </div>
        <div className="text-center text-xl font-semibold text-red-800">
          {t("accessDenied")}
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
