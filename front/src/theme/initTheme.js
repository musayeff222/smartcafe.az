const KEY = "smartcafe_theme";
const LEGACY_KEY = "smartcafe_dashboard_theme";

export function getStoredTheme() {
  try {
    return localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY) || "light";
  } catch {
    return "light";
  }
}

export function applyThemeToDocument(theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/** Call before React render to avoid flash */
export function initTheme() {
  applyThemeToDocument(getStoredTheme() === "dark" ? "dark" : "light");
}

export const THEME_STORAGE_KEY = KEY;
