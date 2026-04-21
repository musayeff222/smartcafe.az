// API bağlantı adresleri — .env (REACT_APP_*) dosyasından okunur.
// .env.production / .env.development dosyalarını kullanın.
// Örnek değişkenler için .env.example dosyasına bakın.

const stripTrailingSlash = (value) =>
  typeof value === 'string' ? value.replace(/\/+$/, '') : value;

const apiBaseFromEnv = stripTrailingSlash(process.env.REACT_APP_API_BASE_URL);
const imgBaseFromEnv = stripTrailingSlash(process.env.REACT_APP_IMG_BASE_URL);
const domainFromEnv  = stripTrailingSlash(process.env.REACT_APP_DOMAIN_URL);

// Geriye dönük uyumluluk: env tanımlı değilse eski smartcafe.az değerlerine düş.
export const base_url  = apiBaseFromEnv || 'https://api.smartcafe.az/api';
export const img_url   = imgBaseFromEnv || 'https://api.smartcafe.az/storage';
export const domain_url = domainFromEnv || 'https://smartcafe.az';
