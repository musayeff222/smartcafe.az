# SmartCafe — DigitalOcean → Hostinger Migrasyon Rehberi

> **Plan:** Hostinger **Business / Premium Web Hosting** (hPanel + SSH)  
> **Strateji:** Önce `test.smartcafe.az` subdomain'ine deploy et, çalışınca ana domaine geç.  
> **Mimari:** Tek domain altında → React kök, Laravel `/api` altında.

---

## 0. Hızlı mimari özet

```
test.smartcafe.az/              → React build (SPA, index.html)
test.smartcafe.az/api/*         → Laravel API (symlink ile bağlanıyor)
test.smartcafe.az/storage/*     → Laravel public storage (symlink)
```

Hostinger dosya yerleşimi:

```
/home/u1234567/
├── domains/
│   └── test.smartcafe.az/
│       └── public_html/                ← React build dosyaları buraya
│           ├── index.html
│           ├── static/
│           ├── .htaccess               ← SPA routing
│           ├── api          → symlink → ../../laravel-api/public
│           └── storage      → symlink → ../../laravel-api/storage/app/public
└── laravel-api/                        ← Laravel'in TÜM dosyaları (public_html DIŞI)
    ├── app/  bootstrap/  config/  ...
    └── public/
```

> **Neden böyle?** Laravel'in `vendor/`, `.env`, `storage/` gibi klasörleri web'den erişilemez olmalı. Bu yüzden Laravel'i `public_html` **dışına** koyup sadece `public/` klasörünü symlink ile içeri açıyoruz. Hostinger'da bu en güvenli ve en temiz yöntem.

---

## 1. Hostinger hPanel ön hazırlıkları

### 1.1. Subdomain oluştur
1. hPanel → **Subdomains** → `test.smartcafe.az` ekle (ya da DNS'i Hostinger'a taşımadıysan, geçici olarak Hostinger'ın verdiği `xxx.hostingersite.com` adresini kullan).
2. Oluşunca **Document Root**'u kontrol et: `domains/test.smartcafe.az/public_html` olmalı.

### 1.2. PHP versiyonunu ayarla
1. hPanel → **Advanced** → **PHP Configuration** → seçilen domain = `test.smartcafe.az`.
2. **PHP Version**: 8.2 veya 8.3 (Laravel 11 için minimum 8.2).
3. **PHP Extensions**: şunların açık olduğundan emin ol:  
   `mbstring`, `openssl`, `pdo_mysql`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `fileinfo`, `curl`, `gd` (veya `imagick`), `zip`, `intl`.
4. **PHP Options** sekmesi:
   - `memory_limit` → 256M
   - `max_execution_time` → 180
   - `upload_max_filesize` → 64M
   - `post_max_size` → 64M

### 1.3. MySQL veritabanı oluştur
1. hPanel → **Databases** → **MySQL Databases**.
2. Yeni DB oluştur → ör. `u1234567_restoran`, kullanıcı `u1234567_restoran`, güçlü şifre.
3. **"Grant all privileges"** işaretle.
4. **phpMyAdmin**'e gir → yeni DB'yi seç → **Import** → DigitalOcean'dan aldığın `.sql` yedeğini yükle.

> 💡 Yedek büyükse (>50MB), SSH ile `mysql -u ... -p dbname < backup.sql` komutuyla import etmek daha güvenli. Bunu 4. adımda yapacağız.

### 1.4. SSL sertifikası
1. hPanel → **Security** → **SSL** → `test.smartcafe.az` için **Install SSL** (Let's Encrypt, ücretsiz).
2. **Force HTTPS**'i aktif et.

### 1.5. SSH erişimini aktif et
1. hPanel → **Advanced** → **SSH Access** → **Enable**.
2. IP adresini whitelist'e ekle (veya "Allow all" — ama güvenlik için spesifik IP önerilir).
3. SSH bilgileri (host, port, username) ekranda görünür. Terminal'den:
   ```
   ssh -p <port> u1234567@<host>
   ```

---

## 2. Proje dosyalarını hazırla (yerel bilgisayarda)

Bu repoda senin için zaten şu değişiklikleri yaptım:

| Dosya | Ne oldu? |
|---|---|
| `front/src/api/index.js` | `smartcafe.az` URL'leri kaldırıldı, `REACT_APP_*` env'den okunuyor |
| `front/src/api.js` | Aynı şekilde env tabanlı |
| `front/.env.example` | Yeni — kopyala `.env.production` yap |
| `front/public/.htaccess` | Yeni — React Router + HTTPS redirect + cache |
| `api/config/cors.php` | `CORS_ALLOWED_ORIGINS` env'den okunuyor |
| `api/.env.hostinger.example` | Yeni — sunucuda `.env` olarak kullanacaksın |

### 2.1. Frontend build
```powershell
cd front
# 1. Test domain için env oluştur
Copy-Item .env.example .env.production
# .env.production içinde test.smartcafe.az'a ayarla (veya hostinger subdomain'i)

# 2. Temiz build
npm install
npm run build
```

`front/build/` klasörünü bir yere kaydet — bunu 4. adımda upload edeceğiz.

### 2.2. Backend'i ZIP'le
Yerel `api/` klasöründe:
```powershell
# vendor/ ve .env'i hariç tut
# Windows'ta PowerShell ile:
cd api
Compress-Archive -Path * -DestinationPath ../laravel-api.zip -Force `
  -Exclude @('vendor', '.env', 'node_modules', 'storage\logs\*', 'storage\framework\cache\*', 'storage\framework\sessions\*', 'storage\framework\views\*')
```

> ⚠️ `.env` dosyası **kesinlikle** ZIP'e girmesin. Üretim için `api/.env.hostinger.example`'ı sunucuda `.env` olarak kullanacağız.  
> `vendor/` klasörünü de yollama, sunucuda `composer install` ile üreteceğiz (daha küçük upload + doğru PHP versiyonuna göre dependency).

---

## 3. Dosyaları Hostinger'a yükle

### 3.1. Laravel dosyaları → `/home/u1234567/laravel-api/`
1. SSH'la bağlan:
   ```
   ssh -p 65002 u1234567@<host>
   ```
2. Klasör oluştur ve ZIP'i yükle (yerelden):
   ```powershell
   scp -P 65002 laravel-api.zip u1234567@<host>:~/
   ```
3. Sunucuda aç:
   ```bash
   cd ~
   mkdir -p laravel-api
   unzip laravel-api.zip -d laravel-api
   rm laravel-api.zip
   cd laravel-api
   ```

### 3.2. React build → `public_html/`
1. hPanel → **Files** → **File Manager** → `domains/test.smartcafe.az/public_html/`.
2. İçini **komple boşalt** (varsayılan Hostinger index.html vs. sil).
3. Yerel `front/build/` klasörünün **içindeki her şeyi** buraya yükle (zip'leyip file manager'dan upload + extract en hızlısı).

---

## 4. Laravel'i sunucuda kur

SSH oturumunda `~/laravel-api/` içinde:

### 4.1. Composer bağımlılıkları
```bash
cd ~/laravel-api

# Composer var mı?
composer --version
# yoksa:
# curl -sS https://getcomposer.org/installer | php
# mv composer.phar ~/bin/composer

composer install --no-dev --optimize-autoloader
```

### 4.2. `.env` dosyasını oluştur
```bash
cp .env.hostinger.example .env
nano .env
```
Dosyadaki alanları doldur (DB bilgileri, APP_URL=`https://test.smartcafe.az`, CORS vb.). Kaydet ve çık.

```bash
php artisan key:generate
```

### 4.3. DB import (yerel .sql yedek sunucuya atılırsa)
```bash
# Yerelden:
scp -P 65002 digitalocean-backup.sql u1234567@<host>:~/

# Sunucuda:
mysql -u u1234567_restoran -p u1234567_restoran < ~/digitalocean-backup.sql
rm ~/digitalocean-backup.sql   # güvenlik
```

### 4.4. Storage link ve izinler
```bash
php artisan storage:link     # laravel-api/public/storage oluşturur
php artisan config:cache
php artisan route:cache
php artisan view:cache

# İzinler
chmod -R 775 storage bootstrap/cache
```

### 4.5. Symlink'leri kur (en kritik adım)
```bash
cd ~/domains/test.smartcafe.az/public_html

# Eski varsa sil
rm -rf api storage

# Symlink oluştur
ln -s ~/laravel-api/public api
ln -s ~/laravel-api/storage/app/public storage
```

> ⚠️ **Hostinger'da symlink çalışmazsa** (bazı shared planlarda kısıtlı olabilir): Plan B → Laravel'in `public/` içeriğini `public_html/api/` altına kopyala ve `public/index.php`'deki `require __DIR__.'/../vendor/autoload.php'` satırını `require __DIR__.'/../../laravel-api/vendor/autoload.php'` olarak değiştir. Ama 99% ihtimalle symlink çalışır.

### 4.6. DB migration (YENİ kurulumsa)
Zaten DigitalOcean yedeğini import ettiysen **bu adımı atla**. Eğer sıfırdan başlıyorsan:
```bash
cd ~/laravel-api
php artisan migrate --force
```

---

## 5. Test et

### 5.1. API çalışıyor mu?
Tarayıcıda aç: `https://test.smartcafe.az/api/own-restaurants`  
→ JSON dönmeli (401/403 olsa bile JSON dönüyorsa çalışıyor demektir. HTML dönüyorsa symlink veya .htaccess sorunu var).

### 5.2. Frontend çalışıyor mu?
`https://test.smartcafe.az/` → React uygulaması açılmalı.  
DevTools → Network → Istekler `/api/...`'e gidiyor, 200 dönüyor olmalı.

### 5.3. Login testi
Backup'taki bir kullanıcı ile giriş yap. Görseller (`img_url`) yükleniyor mu kontrol et.

---

## 6. Sorun giderme (troubleshooting)

| Belirti | Muhtemel sebep | Çözüm |
|---|---|---|
| `500 Server Error` | PHP versiyonu, `.env` eksik, izinler | `~/laravel-api/storage/logs/laravel.log`'a bak |
| API `404` dönüyor | Symlink yok veya .htaccess eksik | `ls -la public_html/api` ile symlink'i kontrol et |
| API `HTML` dönüyor (React index.html) | `public/.htaccess` `/api`'yı kendisine yönlendiriyor | `front/public/.htaccess` dosyasında `RewriteRule ^api(/.*)?$ - [L]` olmalı (hazır koyduk) |
| CORS hatası | `.env`'de `CORS_ALLOWED_ORIGINS` yok/yanlış | Env'e domain'i ekle, `php artisan config:cache` |
| Login sonrası 419 CSRF | Sanctum stateful domains | `.env`'de `SANCTUM_STATEFUL_DOMAINS=test.smartcafe.az` |
| Görsel yüklenmiyor | `storage` symlink yok | `ln -s ~/laravel-api/storage/app/public public_html/storage` |
| Cache eski | Config cache bozuk | `php artisan config:clear && php artisan cache:clear` |

### Log dosyası
```bash
tail -f ~/laravel-api/storage/logs/laravel.log
```

---

## 7. Ana domain'e geçiş (test çalışınca)

Her şey `test.smartcafe.az`'da çalışıyorsa ana domain'e geçiş 15 dakikalık bir iş:

1. DNS'i Hostinger'a yönlendir: Domain registrar'ında (smartcafe.az'ı aldığın yerde) **nameserver**'ları Hostinger'ın verdikleriyle değiştir (`ns1.dns-parking.com`, `ns2.dns-parking.com` tipi) **veya** A kaydını Hostinger IP'sine al.
2. hPanel'de ana domain için aynı adımları uygula (SSL, PHP vers., DB bağlantısı).
3. `front/.env.production` içinde URL'leri `smartcafe.az` yap, yeniden `npm run build`, yeni build'i ana domain'in `public_html`'ine yükle.
4. Laravel `.env` içinde `APP_URL`, `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS`, `CORS_ALLOWED_ORIGINS` değerlerini ana domain olarak güncelle, `php artisan config:cache` çalıştır.
5. DNS propagation için 2-48 saat bekle.

---

## 8. Sonraki bakım komutları

```bash
# Yeni kod deploy ederken:
cd ~/laravel-api
git pull  # (eğer git kullanacaksan)
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

Frontend update:
```
cd front
npm run build
# build/ içeriğini public_html'e yükle
```

---

## 9. Güvenlik checklist ✅

- [ ] `.env` içinde `APP_DEBUG=false`
- [ ] `APP_KEY` `php artisan key:generate` ile üretildi
- [ ] DB şifresi güçlü (en az 16 karakter, özel karakterli)
- [ ] `.env` dosyası git'e commit edilmedi (`.gitignore`'da zaten var)
- [ ] SSL aktif ve "Force HTTPS" açık
- [ ] SSH erişim sadece kendi IP'ne açık
- [ ] DigitalOcean'daki eski sunucu kapatılmadan önce yedek yeniden alındı
- [ ] Backup JSON dosyaları public klasörde değil

---

İhtiyacın olursa adım adım her birini beraber geçelim. Özellikle **3.1 (SSH + scp)** ve **4.5 (symlink)** ilk denemede kafa karıştırabilir; takılırsan hata mesajını at, bakarım.
