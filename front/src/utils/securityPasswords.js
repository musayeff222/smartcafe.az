/**
 * POS təhlükəsizlik şifrələri — serverdə (MySQL) bcrypt hash kimi saxlanır.
 * Brauzerdə yalnız keş (oxunan meta); pin düz mətni yalnız HTTPS üzərindən PUT/verify zamanı gedir.
 */

import axios from "axios";
import { base_url } from "../api";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/** @type {{ categories: Array<{ key: string, is_enabled: boolean, has_custom_pin: boolean }> } | null} */
let settingsCache = null;
let fetchPromise = null;

export const PASSWORD_CATEGORIES = [
  {
    key: "azaltma",
    label: "Məhsul azaltma",
    description:
      "Masadakı məhsul sayını azaltmaq üçün tələb olunan şifrə",
    defaultPassword: "5669",
  },
  {
    key: "silme",
    label: "Silmə",
    description: "Masadan məhsul silmək üçün tələb olunan şifrə",
    defaultPassword: "5669",
  },
  {
    key: "legv",
    label: "Masa ləğvi",
    description: "Masanı bağlamaq / ləğv etmək üçün tələb olunan şifrə",
    defaultPassword: "3478",
  },
  {
    key: "anbar",
    label: "Anbar",
    description:
      "Anbar, stok, set və məhsul tənzimləmələri üçün tələb olunan şifrə",
    defaultPassword: "090922",
  },
  {
    key: "kassa",
    label: "Kassa",
    description: "Gündəlik kassa və maliyyə hesabatları üçün tələb olunan şifrə",
    defaultPassword: "090922",
  },
];

export function invalidateSecuritySettingsCache() {
  settingsCache = null;
  fetchPromise = null;
}

/**
 * API-dən təhlükəsizlik üzrə meta məlumatı yükləyir (bir neçə paralel çağırış bir sorğuda birləşir).
 */
export async function prefetchSecuritySettings() {
  const token = localStorage.getItem("token");
  if (!token) {
    invalidateSecuritySettingsCache();
    return null;
  }
  if (settingsCache) return settingsCache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = axios
    .get(`${base_url}/restaurant/security-settings`, authHeaders())
    .then((res) => {
      settingsCache = res.data;
      fetchPromise = null;
      try {
        window.dispatchEvent(new Event("security-settings-updated"));
      } catch (e) {}
      return settingsCache;
    })
    .catch((err) => {
      fetchPromise = null;
      throw err;
    });

  return fetchPromise;
}

/** Admin UI: son məlumatı yenidən çək */
export async function refreshSecuritySettings() {
  invalidateSecuritySettingsCache();
  return prefetchSecuritySettings();
}

export function getAllPasswords() {
  const out = {};
  if (!settingsCache?.categories) return out;
  for (const row of settingsCache.categories) {
    if (row.has_custom_pin) out[row.key] = "••••";
  }
  return out;
}

export function getAllEnabled() {
  const out = {};
  if (!settingsCache?.categories) return out;
  for (const row of settingsCache.categories) {
    out[row.key] = row.is_enabled !== false;
  }
  return out;
}

export function isCategoryEnabled(categoryKey) {
  if (!settingsCache?.categories) return true;
  const row = settingsCache.categories.find((c) => c.key === categoryKey);
  if (!row) return true;
  return row.is_enabled !== false;
}

export function hasCustomPinFor(categoryKey) {
  if (!settingsCache?.categories) return false;
  const row = settingsCache.categories.find((c) => c.key === categoryKey);
  return !!row?.has_custom_pin;
}

/**
 * Serverdə Hash::check — şifrə düzgünlüyü.
 */
export async function verifyPassword(categoryKey, attempt) {
  if (!isCategoryEnabled(categoryKey)) return true;
  const res = await axios.post(
    `${base_url}/restaurant/security-settings/verify`,
    { category: categoryKey, attempt: String(attempt) },
    authHeaders()
  );
  return res.data?.ok === true;
}

/**
 * Bir kateqoriya üçün pin təyin et (server bcrypt saxlayır).
 */
export async function setPassword(categoryKey, value) {
  if (!categoryKey) return;
  const clean = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (clean.length < 4) {
    throw new Error("Şifrə ən az 4 rəqəm olmalıdır");
  }
  await axios.put(
    `${base_url}/restaurant/security-settings`,
    {
      categories: [{ key: categoryKey, pin: clean }],
    },
    authHeaders()
  );
  await refreshSecuritySettings();
}

export async function setCategoryEnabled(categoryKey, enabled) {
  if (!categoryKey) return;
  await axios.put(
    `${base_url}/restaurant/security-settings`,
    {
      categories: [{ key: categoryKey, is_enabled: !!enabled }],
    },
    authHeaders()
  );
  await refreshSecuritySettings();
}

export async function resetCustomPin(categoryKey) {
  if (!categoryKey) return;
  await axios.put(
    `${base_url}/restaurant/security-settings`,
    {
      categories: [{ key: categoryKey, reset_custom_pin: true }],
    },
    authHeaders()
  );
  await refreshSecuritySettings();
}
