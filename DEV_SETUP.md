# SmartCafe — Local Geliştirme Rehberi

> Amaç: yerel bilgisayarda kod yaz → test et → tek komutla `smartcafe.az`'a deploy et.

## 1. Kerece yapılacak kurulum

### 1.1. Laragon kur (PHP 8.3 + MySQL + Composer + phpMyAdmin tek pakette)

1. **https://laragon.org/download/** adresinden **Laragon — Full** indir (~180 MB)
2. Setup çalıştır → "Next / Next / Install" (varsayılan ayarlar OK)
3. Laragon'u aç → sağ tık **menü > PHP > Version** → **PHP 8.3** seç (yoksa **Version > Download more** ile indir)
4. Sağ tık **menü > MySQL > Version** → **MySQL 8.x**
5. Laragon ana penceresi: **Start All** butonuna bas — yeşil olsun

> Laragon varsayılan:
> - PHP: `C:\laragon\bin\php\php-8.3.xx\php.exe`
> - MySQL: `C:\laragon\bin\mysql\mysql-8.0.xx\bin\mysql.exe`
> - Composer: `C:\laragon\bin\composer\composer.bat`
> - MySQL kullanıcı: `root` (şifresiz)

### 1.2. PATH'e PHP + Composer ekle

Laragon → **Menü > Laragon > Add to Windows Path** tıkla → **Yes** → **Restart Laragon**.
Bu PHP, Composer ve MySQL komut satırına eklenir.

### 1.3. Terminal'i kapat ve yeniden aç

PowerShell'i kapat, yeniden aç, kontrol et:
```powershell
php -v          # 8.3.x görünmeli
composer -V     # 2.x görünmeli
mysql --version # 8.0.x görünmeli
node -v         # zaten vardı, 22.x
```

### 1.4. Repo'yu klonla (zaten senin bilgisayarında var)

Eğer yeni bir makineye taşıyacaksan:
```powershell
git clone https://github.com/musayeff222/smartcafe.az.git
cd smartcafe.az
```

Zaten `C:\Users\acer\Desktop\her_sey_yedek` içinde olduğun için bu adımı atla.

## 2. İlk kurulum — local backend

```powershell
cd api
composer install
```

`.env` dosyası yok → `scripts\dev-start.ps1` çalıştırdığında otomatik oluşturulur (Laragon'un default ayarlarıyla). Ama istersen elle:

```powershell
copy .env.example .env
php artisan key:generate
```

`.env`'de **önemli olanlar**:
```
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
DB_DATABASE=restoran
DB_USERNAME=root
DB_PASSWORD=
```

## 3. İlk kurulum — local frontend

```powershell
cd front
npm install
```

`.env.local` dosyası yok → `dev-start.ps1` otomatik oluşturur:
```
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api
REACT_APP_IMG_BASE_URL=http://127.0.0.1:8000/storage
REACT_APP_DOMAIN_URL=http://localhost:3000
```

## 4. Production DB'yi local'e çek (gerçek veriyle test için)

```powershell
.\scripts\db-pull.ps1 -Import
```

Bu komut:
1. Server'da `mysqldump` çalıştırır (~5 saniye)
2. Dump'ı `api/storage/db-dumps/smartcafe_prod_<tarih>.sql` olarak local'e indirir
3. Local `restoran` DB'sine import eder (Laragon MySQL)

> İstediğin zaman tekrar çekebilirsin — üzerine yazar.
> Güvenlik: dumps klasörü `.gitignore`'da, git'e gitmez.

## 5. Her gün kullandığın komutlar

### Dev sunucuları aç
```powershell
.\scripts\dev-start.ps1
```
İki PowerShell penceresi açılır:
- **API** → `http://127.0.0.1:8000` (Laravel)
- **Frontend** → `http://localhost:3000` (React, auto-reload)

### Sadece frontend çalıştır
```powershell
.\scripts\dev-start.ps1 -Only front
```

### Sadece backend
```powershell
.\scripts\dev-start.ps1 -Only api
```

### Kod değişikliğini canlıya gönder
```powershell
.\scripts\deploy.ps1 -Message "user modal bug fix"
```

Bu komut:
1. Değişiklikleri commit eder (mesaj parametre olarak verdiğin)
2. GitHub'a push eder
3. SSH ile VPS'e bağlanır
4. Sunucuda: `git pull` → composer install (gerekirse) → migrate (gerekirse) → npm build → restart
5. Canlı URL'leri kontrol eder (200 dönüyor mu)

**Süre**: ~1-2 dakika (frontend değişmediyse 20 saniye).

### Sadece backend deploy (frontend'e dokunmadıysan hızlı)
```powershell
.\scripts\deploy.ps1 -Message "api fix" -SkipFrontend
```

### DRY-RUN — ne olacağını gör, çalıştırma
```powershell
.\scripts\deploy.ps1 -DryRun
```

### Commit edilmiş değişikliği push etmeden önce deploy kontrolü
```powershell
.\scripts\deploy.ps1 -SkipCommit -DryRun
```

## 6. Dosya yapısı

```
her_sey_yedek/
├── api/                 # Laravel source
│   ├── .env             # local settings (git-ignored)
│   ├── storage/
│   │   └── db-dumps/    # prod DB yedekleri (git-ignored)
├── front/               # React source
│   ├── .env.local       # localhost URLs (git-ignored)
│   └── .env.example     # production URLs (commit)
├── scripts/
│   ├── deploy.ps1       # tek tuşla deploy
│   ├── db-pull.ps1      # prod DB çek
│   └── dev-start.ps1    # dev sunucuları başlat
├── DEV_SETUP.md         # bu dosya
├── HOSTINGER_DEPLOY.md  # ilk kurulum rehberi
└── AI_MIGRATION_PROMPT.txt
```

## 7. Sorun giderme

### "php not found"
Laragon → Menü > Laragon > Add to Windows Path → Restart Laragon → PowerShell'i kapat/aç.

### "SSH connection failed"
```powershell
ssh smartcafe-vps "echo ok"
```
Eğer `smartcafe-vps` tanımıyorsa `~/.ssh/config` dosyasında bu blok olmalı:
```
Host smartcafe-vps
    HostName 76.13.136.137
    User root
    Port 22
    IdentityFile ~/.ssh/smartcafe_vps
```

### Local'de login çalışmıyor (CORS hatası)
`api/.env` dosyasında `CORS_ALLOWED_ORIGINS` kontrol et, `http://localhost:3000` olmalı. Sonra:
```powershell
cd api
php artisan config:clear
```

### Deploy sırasında "duplicate key" hatası
Normal, production'da 1 kere oldu, düzelttim. Yeni yüklemelerde olmayacak.

### "Permission denied" server'da
SSH key yetkisi:
```powershell
icacls $HOME\.ssh\smartcafe_vps /inheritance:r
icacls $HOME\.ssh\smartcafe_vps /grant:r "${env:USERNAME}:(R)"
```

## 8. Guvenlik notlari

- `.env` dosyalarını **asla commit etme** (zaten `.gitignore`'da)
- `api/storage/db-dumps/` **kesinlikle commit etme** (gerçek müşteri verisi içerir)
- `scripts/*.ps1` komutları repo'ya commit OLURURZ — script'lerde şifre yok, SSH key lokal (~/.ssh/smartcafe_vps)
- DB dump'ı başkasıyla paylaşma (müşteri telefon numaraları, fiyatlar vs. var)

## 9. Production'a yeni kod gönderme akışı (özet)

```powershell
# 1. Local'de test et
.\scripts\dev-start.ps1
# Kodu düzenle, http://localhost:3000 test et
# Login OK, her şey güzel çalışıyor mu?

# 2. Deploy et
.\scripts\deploy.ps1 -Message "kısa özet: yeni ödeme özelliği"
# Script git add/commit/push + server deploy yapacak
# ~1-2 dk sonra canlı
```
