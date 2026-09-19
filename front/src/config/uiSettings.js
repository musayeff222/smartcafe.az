/** Səhifə və funksiya açarları — menyu gizlətmə / görünüş tənzimləmələri */

export const UI_PAGES = [
  { key: "panel", path: "/panel", labelKey: "nav.dashboard", group: "main" },
  { key: "masalar", path: "/masalar", labelKey: "nav.tables", group: "main" },
  { key: "siparisler", path: "/siparisler", labelKey: "nav.orders", group: "main" },
  { key: "musteriler", path: "/musteriler", labelKey: "nav.customers", group: "main" },
  { key: "gunluk_kasa", path: "/gunluk-kasa", labelKey: "nav.cash", group: "main" },
  { key: "stok", path: "/stok", labelKey: "nav.warehouseProducts", group: "tanim" },
  { key: "material", path: "/material", labelKey: "nav.rawMaterials", group: "tanim" },
  { key: "stocksadd", path: "/stocksadd", labelKey: "nav.sets", group: "tanim" },
  { key: "personel", path: "/personel-tanimlari", labelKey: "nav.staffRegistration", group: "tanim" },
  { key: "couriers", path: "/couriers", labelKey: "nav.courierRegistration", group: "tanim" },
  { key: "masa_tanimlari", path: "/masa-tanimlari", labelKey: "nav.tableSettings", group: "tanim" },
  { key: "expenses", path: "/expenses", labelKey: "nav.expenses", group: "tanim" },
];

export const UI_FEATURES = [
  {
    key: "siparisler_quick_sale",
    labelKey: "settings.featureQuickSale",
    descKey: "settings.featureQuickSaleDesc",
    relatedPage: "siparisler",
  },
];

export const UI_OPTIONS = [
  {
    key: "siparisler_quick_sale_auto",
    labelKey: "settings.optionQuickSaleAuto",
    descKey: "settings.optionQuickSaleAutoDesc",
    requiresFeature: "siparisler_quick_sale",
  },
];

export const DEFAULT_UI_SETTINGS = {
  hidden_pages: [],
  hidden_features: [],
  options: {
    siparisler_quick_sale_auto: false,
  },
  screen_lock_idle_seconds: 0,
};

export const SCREEN_LOCK_IDLE_OPTIONS = [
  { value: 0, labelKey: "pwd.screenLockOff" },
  { value: 30, labelKey: "pwd.screenLock30" },
  { value: 60, labelKey: "pwd.screenLock60" },
  { value: 120, labelKey: "pwd.screenLock120" },
  { value: 180, labelKey: "pwd.screenLock180" },
  { value: 300, labelKey: "pwd.screenLock300" },
  { value: 600, labelKey: "pwd.screenLock600" },
];

export function normalizeUiSettings(raw) {
  const hidden_pages = Array.isArray(raw?.hidden_pages) ? raw.hidden_pages : [];
  const hidden_features = Array.isArray(raw?.hidden_features) ? raw.hidden_features : [];
  const options = { ...DEFAULT_UI_SETTINGS.options };
  if (raw?.options && typeof raw.options === "object") {
    UI_OPTIONS.forEach(({ key }) => {
      if (key in raw.options) options[key] = Boolean(raw.options[key]);
    });
  }
  const idle = Number(raw?.screen_lock_idle_seconds ?? 0);
  const screen_lock_idle_seconds =
    Number.isFinite(idle) && idle > 0 ? Math.min(Math.floor(idle), 3600) : 0;
  return { hidden_pages, hidden_features, options, screen_lock_idle_seconds };
}

export function isPageVisible(settings, pageKey) {
  if (!pageKey) return true;
  return !(settings?.hidden_pages || []).includes(pageKey);
}

export function isFeatureVisible(settings, featureKey) {
  if (!featureKey) return true;
  return !(settings?.hidden_features || []).includes(featureKey);
}

export function isOptionEnabled(settings, optionKey) {
  if (!optionKey) return false;
  return Boolean(settings?.options?.[optionKey]);
}

export function getScreenLockIdleSeconds(settings) {
  const idle = Number(settings?.screen_lock_idle_seconds ?? 0);
  if (!Number.isFinite(idle) || idle <= 0) return 0;
  return Math.min(Math.floor(idle), 3600);
}

export function pathToPageKey(pathname) {
  const clean = String(pathname || "").split("?")[0].split("#")[0];
  const page = UI_PAGES.find((p) => clean === p.path || clean.startsWith(`${p.path}/`));
  return page?.key || null;
}
