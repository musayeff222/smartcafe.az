import { img_url } from "../api/index";

/** Storage fayl yolu → brauzer URL (həmişə front img_url əsasında) */
export function storageUrl(path) {
  if (!path) return null;

  let normalized = String(path).replace(/\\/g, "/").trim();

  // API bəzən tam URL qaytarır — yalnız path hissəsini götür
  if (/^https?:\/\//i.test(normalized)) {
    try {
      const u = new URL(normalized);
      normalized = u.pathname;
    } catch {
      return normalized;
    }
  }

  normalized = normalized.replace(/^\/+/, "").replace(/^storage\/?/, "");
  if (!normalized) return null;

  const base = img_url.replace(/\/+$/, "");
  return `${base}/${normalized}`;
}

export function formatRestaurantHours(openTime, closeTime) {
  const fmt = (t) => {
    if (!t) return null;
    const s = String(t);
    return s.length >= 5 ? s.slice(0, 5) : s;
  };
  const open = fmt(openTime);
  const close = fmt(closeTime);
  if (open && close) return `${open} – ${close}`;
  if (open) return open;
  if (close) return close;
  return null;
}
