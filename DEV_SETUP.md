# Yerel geliştirme → VPS deploy

## Önkoşullar (Windows)

- **PHP 8.2+** ve **Composer** (örn. [Laragon](https://laragon.org/) veya XAMPP + PATH)
- **Node.js 18+** ve npm
- VPS deploy için **OpenSSH** (`ssh`, `scp`) — Windows’ta genelde yüklü

## 1. Backend (Laravel) — yerel

```powershell
cd api
copy .env.example .env
php artisan key:generate
```

SQLite ile hızlı test için `.env` içinde:

- `DB_CONNECTION=sqlite`
- `# DB_DATABASE=` satırını silip yerine: `DB_DATABASE=database/database.sqlite` kullanın **veya** boş bırakıp `database/database.sqlite` dosyasının var olduğundan emin olun.

```powershell
php artisan migrate
php artisan serve
```

API: `http://127.0.0.1:8000`

Uzaktaki MySQL’e bağlanacaksanız `.env` içinde `DB_*` değerlerini doldurun (SSH tüneli: `DB_HOST=127.0.0.1`).

## 2. Frontend (React) — yerel

```powershell
cd front
copy .env.development.example .env.development
npm install
npm start
```

Uygulama: `http://localhost:3000` — API istekleri `.env.development` içindeki `REACT_APP_API_BASE_URL` adresine gider.

Marka adını değiştirmek için aynı dosyada `REACT_APP_APP_NAME` kullanın (`src/config/branding.js`).

## 3. Deploy — sunucuya taşıma

PowerShell (proje kökünden):

```powershell
.\scripts\deploy-vps.ps1
```

İlk çalıştırmada `$VpsHost`, `$VpsUser` değişkenlerini script içinde düzenleyin veya ortam değişkeni ile geçin:

```powershell
$env:VPS_HOST = "76.13.136.137"
.\scripts\deploy-vps.ps1
```

Script:

1. `front` içinde `npm run build` çalıştırır (production `.env.production` kullanın).
2. API kodunu (vendor/.env hariç) ve build çıktısını sunucuya gönderir.
3. Uzakta `composer install`, migrate, cache komutlarını çalıştırır.

**Not:** Sunucudaki `/var/www/laravel-app/.env` dosyasını bu script **ezmez**.

## 4. Git akışı

1. Değişiklikleri commit edin.
2. `git push origin main`
3. `.\scripts\deploy-vps.ps1` veya sunucuda elle güncelleme.
