import { useEffect, useState, useCallback } from "react";

const KEY = "sc_admin_theme";

function systemDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function currentTheme() {
  const raw = localStorage.getItem(KEY) || "system";
  return raw;
}

export function resolvedTheme() {
  const t = currentTheme();
  if (t === "system") return systemDark() ? "dark" : "light";
  return t;
}

export function applyThemeToHtml(active) {
  const html = document.documentElement;
  if (active) html.classList.add("dark");
  else html.classList.remove("dark");
}

/**
 * useAdminTheme — scoped to admin panel only.
 * onlyWhen: boolean — if false, always remove the `dark` class from <html>.
 */
export function useAdminTheme(onlyWhen = true) {
  const [theme, setTheme] = useState(currentTheme());

  const apply = useCallback((mode) => {
    if (!onlyWhen) {
      applyThemeToHtml(false);
      return;
    }
    const active = mode === "dark" || (mode === "system" && systemDark());
    applyThemeToHtml(active);
  }, [onlyWhen]);

  useEffect(() => {
    apply(theme);
  }, [theme, apply]);

  useEffect(() => {
    if (!onlyWhen) applyThemeToHtml(false);
    return () => applyThemeToHtml(false);
  }, [onlyWhen]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (currentTheme() === "system") apply("system");
    };
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, [apply]);

  const setAndPersist = useCallback((mode) => {
    localStorage.setItem(KEY, mode);
    setTheme(mode);
  }, []);

  return { theme, setTheme: setAndPersist };
}
