# SmartCafe — DigitalOcean → Hostinger Migrasyon Rehberi

> **Plan:** Hostinger **Business / Premium Web Hosting** (hPanel + SSH)
> **Mimari:** İki ayrı “ön yüz” + API:
> - `smartcafe.az` → statik **marketing** sayfası (repodaki `marketing/` — haqqında, planlar, qiymət, CTA → login)
> - `login.smartcafe.az` → **React POS / idarə paneli** (`front` build)
> - `api.smartcafe.az` → Laravel API (ayrı subdomain)

---

## 0. Mimari

```
smartcafe.az          → marketing/ (index.html, styles.css, .htaccess — SPA değil)
login.smartcafe.az    → React build (front/build + SPA .htaccess)
api.smartcafe.az      → Laravel API (public folder = Laravel'in public/'i)
api.smartcafe.az/storage/*  → Laravel storage link
```

Hostinger dosya yerleşimi (önerilen):

```
/home/u1234567/
├── domains/
│   ├── smartcafe.az/
│   │   └── public_html/              ← marketing/ içeriği (statik)
│   │       ├── index.html
│   │       ├── styles.css
│   │       └── .htaccess             ← marketing/.htaccess (HTTPS + www→apex)
│   ├── login.smartcafe.az/
│   │   └── public_html/              ← front/build (React SPA)
│   │       ├── index.html
│   │       ├── static/
│   │       └── .htaccess             ← SPA routing (front/public/.htaccess)
│   └── api.smartcafe.az/
│       └── public_html/              ← Laravel'in public/ içeriği
│           ├── index.php
│           ├── .htaccess             ← Laravel'in kendi .htaccess'i
│           └── storage/              ← `artisan storage:link` çıktısı
└── laravel-app/                      ← Laravel'in KALAN dosyaları (public_html DIŞI)
    ├── app/  bootstrap/  config/
    ├── database/  resources/  routes/
    ├── storage/  vendor/
    └── .env
```

> **Neden bu yapı?** Laravel'in `vendor/`, `.env`, `storage/` gibi klasörleri web'den erişilmemeli. `api.smartcafe.az/public_html/` içine sadece `public/` klasörünün içeriği koyulur, geri kalan her şey bir üst seviyede `~/laravel-app/`'de durur.

**Alternatif (daha basit):** Tüm Laravel'i `api.smartcafe.az/public_html/`'in üstüne koy, document root'u `public_html/public/` olarak değiştir (hPanel → Advanced → Auto Installer yerine manuel). Bu yol kolay ama Hostinger'da document root değiştirmeye izin vermeyebilir, o yüzden yukarıdaki yapı daha garantidir.

---

## 1. Hostinger hPanel ön hazırlıkları

### 1.1. Subdomain oluştur
1. hPanel → **Subdomains** → **Create subdomain**.
2. Subdomain: `api`, Domain: `smartcafe.az` → oluştur. Document root: `domains/api.smartcafe.az/public_html`.
3. Aynı şekilde Subdomain: `login`, Domain: `smartcafe.az` → `domains/login.smartcafe.az/public_html` (POS / React buraya).

### 1.2. Ana domaini bağla (eğer henüz bağlı değilse)
1. Domain registrar'ında (smartcafe.az'ı nereden aldıysan) **nameserver**'ları Hostinger'ın verdikleriyle değiştir:
   - `ns1.dns-parking.com`
   - `ns2.dns-parking.com`
2. **veya** A kaydını Hostinger IP'sine çevir (hPanel → Domains → DNS Zone'da görünür).
3. Propagation için 15 dk – 48 saat bekle (genelde 1 saat yeter).

> 💡 **Test için geçici yol:** `hosts` dosyasına IP + `smartcafe.az`, `login.smartcafe.az`, `api.smartcafe.az` ekleyerek canlı DNS beklemeden test edebilirsin.

### 1.3. PHP versiyonunu ayarla
1. hPanel → **Advanced** → **PHP Configuration**.
2. Seçili domain → **api.smartcafe.az**.
3. **PHP Version**: 8.2 veya 8.3.
4. **PHP Extensions** açık olmalı:
   `mbstring`, `openssl`, `pdo_mysql`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `fileinfo`, `curl`, `gd` (veya `imagick`), `zip`, `intl`.
5. **PHP Options**:
   - `memory_limit` → 256M
   - `max_execution_time` → 180
   - `upload_max_filesize` → 64M
   - `post_max_size` → 64M

### 1.4. MySQL veritabanı oluştur
1. hPanel → **Databases** → **MySQL Databases**.
2. Yeni DB oluştur → DB adı `u1234567_restoran`, user `u1234567_restoran`, güçlü şifre.
3. **"Grant all privileges"** işaretle.
4. **Remote MySQL**'e gerek yok — API sunucusu ile aynı makinede.

### 1.5. SSL sertifikaları
1. hPanel → **Security** → **SSL** → `smartcafe.az`, `login.smartcafe.az`, `api.smartcafe.az` için **Install SSL** (Let's Encrypt).
2. Her biri için **Force HTTPS** aç.

### 1.6. SSH erişimini aktif et
1. hPanel → **Advanced** → **SSH Access** → **Enable**.
2. Bağlan:
   ```
   ssh -p <port> u1234567@<host>
   ```

---

## 2. Proje dosyalarını hazırla (yerel bilgisayarda)

Bu repoda senin için zaten şu değişiklikler yapıldı:

| Dosya | Ne oldu? |
|---|---|
| `front/src/api/index.js` | Canlıda varsayılan SPA kökü `login.smartcafe.az`; `REACT_APP_*` ile ezilebilir |
| `front/src/api.js` | Re-export |
| `front/.env.example` | `REACT_APP_DOMAIN_URL=https://login.smartcafe.az` |
| `front/public/.htaccess` | POS hostu: HTTPS, `www.login` → `login`, SPA fallback |
| `marketing/` | `smartcafe.az` köküne yüklenecek statik marketing |
| `api/config/cors.php` | Varsayılan origin: `login.smartcafe.az` |
| `api/.env.hostinger.example` | `SANCTUM` / `CORS` login subdomain için |

### 2.1. Frontend build

```powershell
cd front
Copy-Item .env.example .env.production
# .env.production: REACT_APP_DOMAIN_URL=https://login.smartcafe.az (api.smartcafe.az aynı)

npm install
npm run build
```

`front/build/` hazır.

### 2.2. Backend için git clone yolunu seçeceğiz
Repo zaten GitHub'da: `https://github.com/musayeff222/smartcafe.az.git`
Sunucuda clone'layacağız, ZIP gerekmiyor.

---

## 3. Sunucuda Laravel kurulumu

SSH ile bağlandıktan sonra:

### 3.1. Kodu çek
```bash
cd ~
git clone https://github.com/musayeff222/smartcafe.az.git smartcafe-repo

# Laravel'i kalıcı konumuna koy
mv smartcafe-repo/api ~/laravel-app
cd ~/laravel-app
```

### 3.2. Composer bağımlılıkları
```bash
composer install --no-dev --optimize-autoloader
```
Composer yoksa:
```bash
curl -sS https://getcomposer.org/installer | php
mkdir -p ~/bin && mv composer.phar ~/bin/composer
echo 'export PATH=$HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 3.3. `.env` oluştur ve düzenle
```bash
cp .env.hostinger.example .env
nano .env
```

Doldurulacak alanlar:
- `APP_URL=https://api.smartcafe.az`
- `DB_*` → Hostinger MySQL bilgileri
- `SESSION_DOMAIN=.smartcafe.az` (login + api aynı cookie jar; baştaki noktayı kaldırma)
- `SANCTUM_STATEFUL_DOMAINS=login.smartcafe.az,api.smartcafe.az`
- `CORS_ALLOWED_ORIGINS=https://login.smartcafe.az,https://www.login.smartcafe.az`
- `MAIL_*` → Hostinger email hesabı bilgileri

Kaydet, çık. Sonra:
```bash
php artisan key:generate
```

### 3.4. Veritabanını import et

**Yöntem A — phpMyAdmin ile** (yedek < 50 MB ise):
hPanel → phpMyAdmin → DB seç → **Import** → `.sql` dosyasını yükle.

**Yöntem B — SSH ile** (daha güvenli, büyük dosyalarda tercih et):
```powershell
# Yerelden Hostinger'a kopyala:
scp -P 65002 digitalocean-backup.sql u1234567@<host>:~/
```
```bash
# Sunucuda:
mysql -u u1234567_restoran -p u1234567_restoran < ~/digitalocean-backup.sql
rm ~/digitalocean-backup.sql
```

### 3.5. Storage link ve cache
```bash
cd ~/laravel-app
php artisan storage:link
php artisan config:cache
php artisan route:cache

chmod -R 775 storage bootstrap/cache
```

### 3.6. **KRİTİK: Public klasörünü subdomain root'una bağla**

api.smartcafe.az'ın document root'u `~/domains/api.smartcafe.az/public_html` ama Laravel `~/laravel-app/public` içinde. İki yol var:

**Yol 1 — Symlink (önerilen, tek komut):**
```bash
# public_html'i komple sil, yerine symlink koy
rm -rf ~/domains/api.smartcafe.az/public_html
ln -s ~/laravel-app/public ~/domains/api.smartcafe.az/public_html
```

Sonra storage için de:
```bash
# (zaten 3.5'te artisan storage:link yaptık; o ~/laravel-app/public/storage oluşturdu,
# symlink üzerinden otomatik erişilecek)
```

**Yol 2 — Dosyaları kopyala + index.php'yi düzelt** (symlink çalışmazsa):
```bash
# public klasörünün içeriğini public_html'e kopyala
cp -r ~/laravel-app/public/. ~/domains/api.smartcafe.az/public_html/

# index.php'yi düzenle:
nano ~/domains/api.smartcafe.az/public_html/index.php
```
Aşağıdaki 2 satırı değiştir:
```php
// Eski:
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

// Yeni:
require __DIR__.'/../../../laravel-app/vendor/autoload.php';
$app = require_once __DIR__.'/../../../laravel-app/bootstrap/app.php';
```

> ⚠️ Yol 2'de her deploy sonrası `public/` değişiklikleri tekrar kopyalamayı unutma. Yol 1 daha temiz.

### 3.7. Test
Tarayıcıda aç: `https://api.smartcafe.az/api/own-restaurants`
→ JSON dönmeli (401/403 bile olsa JSON dönüyorsa başarılı).
HTML dönüyorsa 3.6'ya tekrar bak.

---

## 4. Marketing sitesi (smartcafe.az)

### 4.1. Statik dosyaları yükle
hPanel → **File Manager** → `domains/smartcafe.az/public_html/`.

1. Eski React build varsa temizle (artık kök domen POS değil).
2. Repodaki `marketing/` klasörünün içeriğini yükle: `index.html`, `styles.css`, `.htaccess`.

### 4.2. Test
`https://smartcafe.az/` → marketing sayfası; **Sistemə giriş** `https://login.smartcafe.az/` açmalı.

---

## 5. POS / React (login.smartcafe.az)

### 5.1. Build
Yerelde `front/.env.production` içinde `REACT_APP_DOMAIN_URL=https://login.smartcafe.az` olduğundan emin ol; sonra `npm run build`.

### 5.2. Yükleme
`domains/login.smartcafe.az/public_html/` içine `front/build/` içeriğini yükle (ZIP + Extract veya SFTP).

### 5.3. .htaccess
Build ile `front/public/.htaccess` gelmezse bu repodaki `front/public/.htaccess`'i `public_html/.htaccess` olarak koy.

### 5.4. Test
`https://login.smartcafe.az/` → login / POS SPA. DevTools → API istekleri `api.smartcafe.az`; giriş və şəkil yükləməsi yoxlanılsın.

---

## 6. Sorun giderme

| Belirti | Sebep | Çözüm |
|---|---|---|
| `500 Server Error` (API) | `.env` eksik / izinler | `~/laravel-app/storage/logs/laravel.log`'a bak |
| API `HTML` dönüyor (Laravel welcome) | symlink yanlış / index.php bulunamadı | `ls -la ~/domains/api.smartcafe.az/public_html` kontrol et |
| CORS hatası | `CORS_ALLOWED_ORIGINS` yanlış | `.env`'de `https://login.smartcafe.az` (ve gerekirse `www.login`), `php artisan config:cache` |
| Login sonrası 419 CSRF | SANCTUM yapılandırması | `SANCTUM_STATEFUL_DOMAINS=login.smartcafe.az,api.smartcafe.az` ve `SESSION_DOMAIN=.smartcafe.az` |
| Cookie gönderilmiyor | `SESSION_DOMAIN` yanlış | Baştaki nokta ile `.smartcafe.az` olmalı, `SESSION_SECURE_COOKIE=true` |
| Görsel 404 | `storage` link yok | `cd ~/laravel-app && php artisan storage:link` |
| React sayfada refresh 404 | .htaccess eksik | `login.../public_html/.htaccess` SPA kuralı |
| Cache eski kalıyor | Opcache / config cache | `php artisan config:clear && php artisan cache:clear` |

### 6.1. Log izleme
```bash
tail -f ~/laravel-app/storage/logs/laravel.log
```

---

## 7. Sonraki deploy'ler

### Backend güncelleme:
```bash
cd ~/laravel-app
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

### Marketing güncelleme:
`marketing/` dosyalarını `smartcafe.az/public_html/` üzerine yaz.

### POS (React) güncelleme:
```powershell
cd front
npm run build
# build/ içeriğini login.smartcafe.az/public_html'e yükle
```

---

## 8. Güvenlik checklist ✅

- [ ] `.env` içinde `APP_DEBUG=false`
- [ ] `APP_KEY` generate edildi
- [ ] DB şifresi güçlü (16+ karakter, özel karakter)
- [ ] `.env` git'e commit edilmedi (gitignore'da)
- [ ] `smartcafe.az`, `login.smartcafe.az`, `api.smartcafe.az` SSL + Force HTTPS
- [ ] SSH erişimi sadece kendi IP'ne açık (veya key-based auth)
- [ ] DigitalOcean eski sunucu en az 1 hafta kapatma, yedek için dursun
- [ ] `api.smartcafe.az/storage/logs/` web'den erişilemiyor (Laravel public outside storage)

---

İhtiyacın olursa her adımı beraber yaparız. En çok takılma **3.6 (symlink)** ve **3.3 (.env)**'de olur — oraya geldiğinde hata varsa mesajı at, hızlıca bakarım.
