# Kompüterdə layihə + Hostinger MySQL (uzaq baza)

Məqsəd: **Laravel və React lokal** işləsin, verilənlər isə **Hostinger-dəki real MySQL** olsun.

## 0. Kompüterdə nə olmalıdır

| Tətbiq | Niyə |
|--------|------|
| **Laragon Full** (və ya PHP 8.2+ + Composer) | `php artisan serve`, Composer |
| **Node.js** | `npm start` (React) |
| **Heç bir lokal MySQL məcburi deyil** | Baza uzaqdadır; `dev-start.ps1` lokal MySQL-i avtomatik **işə salmır**, əgər `.env`-də `DB_HOST` `127.0.0.1` deyilsə |

Qurulum: https://laragon.org/download/ → quraşdır → **Menyu → Laragon → Add to Windows Path** → PowerShell-i yenidən aç → `php -v` yoxla.

## 1. Hostinger (hPanel) — Remote MySQL

1. **hPanel** → **Databases** → **Remote MySQL** (və ya oxşar).
2. **Öz ev/ofis İP ünvanını** əlavə et (Google-da “what is my ip”).
3. **MySQL Database** bölməsindən köçür:
   - **Hostname / Server** (bu **127.0.0.1 deyil** — məs. `srvXXXX.hstgr.io` tipli ünvan)
   - Database adı, istifadəçi, parol

> Serverdə `.env`-də yazılan `DB_HOST=127.0.0.1` yalnız **serverin özündə** işləyir. Kompüterdən qoşulanda **mütləq** hPaneldə göstərilən **uzaq host** istifadə olunur.

## 2. Layihədə `.env` — avtomatik skript

Repo kökündən (parametr də verə bilərsən):

```powershell
cd c:\Users\acer\Desktop\her_sey_yedek
.\scripts\setup-hostinger-mysql.ps1
```

Sorğu çıxacaq: `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.

Və ya bir sətirdə (parolda xüsusi simvol varsa interaktiv üstün tutulur):

```powershell
.\scripts\setup-hostinger-mysql.ps1 -DbHost "srv123.hstgr.io" -DbName "u123_db" -DbUser "u123_user" -DbPassword "..."
```

Skript: `api/.env` yaradır/yeniləyir, `SESSION_DRIVER=file`, `CACHE_STORE=array` (lokalda əlavə cache/sessiya cədvəli tələbi azaldır), CORS üçün `localhost:3000` əlavə edir, `php artisan config:clear` və **`db:show`** ilə qoşulmanı yoxlayır.

## 3. Backend və frontend

```powershell
cd c:\Users\acer\Desktop\her_sey_yedek\api
composer install
cd ..
.\scripts\dev-start.ps1
```

Və ya yalnız API:

```powershell
.\scripts\dev-start.ps1 -Only api
```

Brauzer: **http://127.0.0.1:8000/up** — işləyirsə Laravel qalxıb.

`front/.env.local`:

```env
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api
REACT_APP_IMG_BASE_URL=http://127.0.0.1:8000/storage
REACT_APP_DOMAIN_URL=http://localhost:3000
```

**Vacib:** Canlı bazada olan şəkillər `https://api.smartcafe.az/storage/...` ola bilər; lokal API öz `storage`-nu işlədir — yalnız **DB** üst-üstə düşür, **fayllar** avtomatik sinxron olmaya bilər.

## 4. Təhlükəsizlik

- **`migrate`** işlətmə** kənar mühitdə düşünülmüş addımdır — canlı sxemi poza bilər.
- Uzaq MySQL whitelist-ə yalnız **öz sabit IP-ni** əlavə et; iş bitəndə sili̽nə bilər.
- **`api/.env` git-ə düşməsin** (adətən `.gitignore`-dadır).

## 5. Yığcam yoxlama

| Addım | Əmr / ünvan |
|-------|-------------|
| PHP | `php -v` |
| Baza | Skript sonunda `db:show` və ya `cd api; php artisan db:show` |
| API | `http://127.0.0.1:8000/up` |
| Login | React `http://localhost:3000` — istifadəçi canlı DB-də olmalıdır |
