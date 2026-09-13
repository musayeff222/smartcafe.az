import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_LOCALE, messages, normalizeLocale } from "./locales";

const STORAGE_KEY = "app_language";

const LanguageContext = createContext(null);

function readInitialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return normalizeLocale(stored);
    }
  } catch (e) {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

function interpolate(str, params) {
  if (!params || typeof str !== "string") return str;
  return Object.entries(params).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v ?? "")),
    str
  );
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(readInitialLocale);

  const setLocale = useCallback((code) => {
    const next = normalizeLocale(code);
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}
    document.documentElement.lang = next;
    try {
      window.dispatchEvent(new CustomEvent("app-language-changed", { detail: next }));
    } catch (e) {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key, paramsOrFallback, maybeFallback) => {
      let params = null;
      let fallback;
      if (paramsOrFallback && typeof paramsOrFallback === "object") {
        params = paramsOrFallback;
        fallback = maybeFallback;
      } else {
        fallback = paramsOrFallback;
      }
      const dict = messages[locale] || messages[DEFAULT_LOCALE];
      const raw =
        dict[key] ?? messages[DEFAULT_LOCALE][key] ?? fallback ?? key;
      return interpolate(raw, params);
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

export function applyRestaurantLanguage(code) {
  const next = normalizeLocale(code);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch (e) {}
  document.documentElement.lang = next;
  return next;
}
