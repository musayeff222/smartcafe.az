// SmartCafe üçün çoxşaxəli təhlükəsizlik şifrələri.
// Köhnə: localStorage-da açıq mətn. Yeni: securityVault ilə AES-256-GCM + əsas PIN.

import {
  hasVault,
  isVaultUnlocked,
  getMirrorPasswords,
  setMirrorPassword,
  persistPasswords,
  readLegacyPasswordsMap,
  VAULT_LOCKED_SENTINEL,
} from "./securityVault";

export { VAULT_LOCKED_SENTINEL };

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

const LS_PASSWORDS_KEY = "security_passwords";
const LS_ENABLED_KEY = "security_passwords_enabled";

const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const readMap = (key) => {
  try {
    return safeParse(localStorage.getItem(key));
  } catch (e) {
    return {};
  }
};

const writeMap = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
};

export const getAllPasswords = () => {
  if (isVaultUnlocked()) return getMirrorPasswords();
  if (hasVault()) return {};
  return readMap(LS_PASSWORDS_KEY);
};

export const getAllEnabled = () => readMap(LS_ENABLED_KEY);

export const getPassword = (categoryKey) => {
  if (hasVault() && !isVaultUnlocked()) return VAULT_LOCKED_SENTINEL;

  let map = {};
  if (isVaultUnlocked()) map = getMirrorPasswords();
  else map = readMap(LS_PASSWORDS_KEY);

  if (map[categoryKey]) return String(map[categoryKey]);
  const cat = PASSWORD_CATEGORIES.find((c) => c.key === categoryKey);
  return cat ? cat.defaultPassword : "";
};

/**
 * @returns {Promise<void>}
 */
export const setPassword = async (categoryKey, value) => {
  if (!categoryKey) return;
  const clean = String(value || "").replace(/\D/g, "").slice(0, 6);
  if (clean.length < 4) {
    throw new Error("Şifrə ən az 4 rəqəm olmalıdır");
  }

  if (hasVault()) {
    if (!isVaultUnlocked()) {
      throw new Error("Əsas PIN ilə kilidi açın");
    }
    setMirrorPassword(categoryKey, clean);
    await persistPasswords();
    return;
  }

  const map = readMap(LS_PASSWORDS_KEY);
  map[categoryKey] = clean;
  writeMap(LS_PASSWORDS_KEY, map);
};

export const isCategoryEnabled = (categoryKey) => {
  const map = getAllEnabled();
  return map[categoryKey] !== false;
};

export const setCategoryEnabled = (categoryKey, enabled) => {
  if (!categoryKey) return;
  const map = getAllEnabled();
  map[categoryKey] = !!enabled;
  writeMap(LS_ENABLED_KEY, map);
};

export const verifyPassword = (categoryKey, attempt) => {
  if (!isCategoryEnabled(categoryKey)) return true;
  if (hasVault() && !isVaultUnlocked()) return false;
  const expected = getPassword(categoryKey);
  if (expected === VAULT_LOCKED_SENTINEL) return false;
  return String(attempt) === String(expected);
};
