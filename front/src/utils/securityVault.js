/**
 * Brauzerdə şifrə xəritəsini AES-256-GCM ilə şifrələyir.
 * Açar materialı: istifadəçinin təyin etdiyi əsas PIN + təsadüfi duz (PBKDF2, 210000 iterasiya).
 * Açar yalnız sessiya yaddaşındadır; səhifə yenilənəndə yenidən PIN tələb olunur.
 *
 * Qeyd: XSS və ya cihaza tam giriş halında heç bir yalnız front-end həll tam qoruma vermir;
 * prod üçün server tərəfi saxlama tövsiyə olunur.
 */

const VAULT_STORAGE_KEY = "security_vault_v2";
const LEGACY_PW_KEY = "security_passwords";
const PBKDF2_ITERATIONS = 210000;

/** @type {CryptoKey | null} */
let sessionAesKey = null;
/** @type {Record<string, string> | null} */
let sessionPasswords = null;

const te = new TextEncoder();
const td = new TextDecoder();

export const VAULT_LOCKED_SENTINEL = "__VAULT_LOCKED__";

export function bufToB64(buf) {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function b64ToBuf(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function randomBytes(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

async function deriveAesKeyFromPin(pin, saltInput) {
  const salt =
    saltInput instanceof Uint8Array
      ? saltInput
      : new Uint8Array(saltInput);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    te.encode(String(pin)),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptGcm(key, plaintextUtf8, iv) {
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    te.encode(plaintextUtf8)
  );
  return new Uint8Array(ct);
}

async function decryptGcm(key, iv, ciphertext) {
  const buf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return td.decode(buf);
}

export function hasVault() {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return false;
    const o = JSON.parse(raw);
    return o && o.v === 2 && o.salt && o.iv && o.data;
  } catch {
    return false;
  }
}

export function isVaultUnlocked() {
  return !!(sessionAesKey && sessionPasswords);
}

export function needsVaultUnlock() {
  return hasVault() && !isVaultUnlocked();
}

export function getMirrorPasswords() {
  return sessionPasswords ? { ...sessionPasswords } : {};
}

export function readLegacyPasswordsMap() {
  try {
    const raw = localStorage.getItem(LEGACY_PW_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

export function hasLegacyPlaintextPasswords() {
  const m = readLegacyPasswordsMap();
  return Object.keys(m).length > 0;
}

/**
 * @param {string} pin
 */
export async function unlockVault(pin) {
  if (!hasVault()) throw new Error("Vault mövcud deyil");
  const meta = JSON.parse(localStorage.getItem(VAULT_STORAGE_KEY));
  const salt = new Uint8Array(b64ToBuf(meta.salt));
  const iv = new Uint8Array(b64ToBuf(meta.iv));
  const data = new Uint8Array(b64ToBuf(meta.data));
  const key = await deriveAesKeyFromPin(pin, salt);
  const plain = await decryptGcm(key, iv, data);
  const parsed = JSON.parse(plain);
  sessionAesKey = key;
  sessionPasswords = { ...(parsed.passwords || {}) };
}

/**
 * @param {string} pin
 * @param {Record<string, string>} [initialPasswords]
 */
export async function createVault(pin, initialPasswords = {}) {
  const salt = randomBytes(16);
  const key = await deriveAesKeyFromPin(pin, salt);
  sessionAesKey = key;
  sessionPasswords = { ...initialPasswords };
  const payload = { passwords: sessionPasswords };
  const iv = randomBytes(12);
  const ct = await encryptGcm(key, JSON.stringify(payload), iv);
  const saltSlice = salt.buffer.slice(
    salt.byteOffset,
    salt.byteOffset + salt.byteLength
  );
  const ivSlice = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength);
  const ctSlice = ct.buffer.slice(ct.byteOffset, ct.byteOffset + ct.byteLength);
  localStorage.setItem(
    VAULT_STORAGE_KEY,
    JSON.stringify({
      v: 2,
      salt: bufToB64(saltSlice),
      iv: bufToB64(ivSlice),
      data: bufToB64(ctSlice),
    })
  );
  try {
    localStorage.removeItem(LEGACY_PW_KEY);
  } catch {}
}

export async function persistPasswords() {
  if (!sessionAesKey || sessionPasswords === null) {
    throw new Error("Vault kilidi açılmayıb");
  }
  const meta = JSON.parse(localStorage.getItem(VAULT_STORAGE_KEY));
  const iv = randomBytes(12);
  const payload = { passwords: { ...sessionPasswords } };
  const ct = await encryptGcm(sessionAesKey, JSON.stringify(payload), iv);
  const ivSlice = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength);
  const ctSlice = ct.buffer.slice(ct.byteOffset, ct.byteOffset + ct.byteLength);
  localStorage.setItem(
    VAULT_STORAGE_KEY,
    JSON.stringify({
      v: 2,
      salt: meta.salt,
      iv: bufToB64(ivSlice),
      data: bufToB64(ctSlice),
    })
  );
}

/**
 * @param {string} categoryKey
 * @param {string} value
 */
export function setMirrorPassword(categoryKey, value) {
  if (sessionPasswords === null) sessionPasswords = {};
  sessionPasswords[categoryKey] = value;
}

export function lockVaultSession() {
  sessionAesKey = null;
  sessionPasswords = null;
}

export function isWebCryptoSupported() {
  return (
    typeof crypto !== "undefined" &&
    crypto.subtle &&
    typeof crypto.subtle.importKey === "function"
  );
}
