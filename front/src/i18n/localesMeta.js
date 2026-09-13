export const SUPPORTED_LOCALES = [
  { code: "az", label: "Azərbaycan", flag: "🇦🇿" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

/** Ilk acilis ve taninmayan kodlar ucun */
export const DEFAULT_LOCALE = "az";

export function normalizeLocale(code) {
  const c = (code || "").toLowerCase().slice(0, 2);
  return ["az", "tr", "ru", "en"].includes(c) ? c : DEFAULT_LOCALE;
}

/** Istifadeci hele dil secmeyibse true */
export function hasUserLanguageChoice() {
  try {
    return !!localStorage.getItem("app_language");
  } catch {
    return false;
  }
}
