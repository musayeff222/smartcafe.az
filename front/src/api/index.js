// API bağlantı adresleri — .env (REACT_APP_*) dosyasından okunur.
// .env.production / .env.development dosyalarını kullanın.
// Örnek değişkenler için .env.example dosyasına bakın.

const stripTrailingSlash = (value) =>
  typeof value === 'string' ? value.replace(/\/+$/, '') : value;

const apiBaseFromEnv = stripTrailingSlash(process.env.REACT_APP_API_BASE_URL);
const imgBaseFromEnv = stripTrailingSlash(process.env.REACT_APP_IMG_BASE_URL);
const domainFromEnv  = stripTrailingSlash(process.env.REACT_APP_DOMAIN_URL);

const isProd = process.env.NODE_ENV === 'production';

// Env yoxdursa: development-da lokal API, production-da canlı domen.
export const base_url =
  apiBaseFromEnv || (isProd ? 'https://api.smartcafe.az/api' : 'http://127.0.0.1:8000/api');
export const img_url =
  imgBaseFromEnv || (isProd ? 'https://api.smartcafe.az/storage' : 'http://127.0.0.1:8000/storage');
export const domain_url =
  domainFromEnv || (isProd ? 'https://login.smartcafe.az' : 'http://localhost:3000');

/** Resolve a stored media path (website/x.png, /storage/..., or full URL) to an absolute URL. */
export const mediaUrl = (path) => {
  if (!path) return "";
  const raw = String(path).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  const clean = raw.replace(/^\/storage\/?/i, "").replace(/^\//, "");
  return `${img_url}/${clean}`;
};

/** Bearer token ile JSON istekleri (çoğu axios çağrısı bunu kullanır). */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
};
