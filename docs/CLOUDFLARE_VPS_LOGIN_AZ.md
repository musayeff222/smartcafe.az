# Cloudflare + VPS: `login.smartcafe.az` (POS) necə qurulur

Siz domeni Cloudflare-də idarə edirsiniz, sayt isə öz VPS-inizdədir. VPS-də dəyişiklik etmək istəmirsinizsə, **bir dəfəlik** bu işi edən adam (və ya siz SSH ilə) aşağıdakıları yerinə yetirməlidir.

---

## 1) Cloudflare — DNS (siz edə bilərsiniz, panel tanışdır)

1. Cloudflare → **DNS** → **Records**.
2. **Add record**:
   - **Type:** `A`
   - **Name:** `login`
   - **IPv4 address:** VPS-inizin **public IP**-si (məs. `76.13.136.137`)
   - **Proxy status:** əvvəl **DNS only** (bulud **Boz**) saxlayın — ilk SSL (Let's Encrypt) alınanadək rahat olur; sertifikat alındıqdan sonra **Proxied** (Narıncı) aça bilərsiniz.
3. `api` üçün də eyni cür **A** qeydi varsa, o da VPS IP-yə getsin.

Yayılmayı gözləyin: `ping login.smartcafe.az` IP-nizi göstərməlidir.

---

## 2) VPS-ə giriş nə lazımdır?

| Lazım olan | Nə üçündür |
|------------|------------|
| **SSH** | `root@VPS_IP` və ya sudo-lu istifadəçi — əmrləri yerinə yetirmək üçün |
| **80 və 443 portları** açıq | Brauzer + Let's Encrypt üçün |
| **Nginx** (və ya Apache) | `login.smartcafe.az` üçün statik React build xidmət etmək |

Şifrə/SSH açarı **repoya yazılmamalıdır**. Windows-da açar: `scripts\deploy-vps.ps1` içində `$env:VPS_KEY` ilə göstərilir.

---

## 3) VPS-də bir dəfə: Nginx + qovluq

VPS-ə SSH ilə daxil olun, repodakı skripti serverə köçürüb işlədin **və ya** skript məzmununu əl ilə yapışdırın:

```bash
# Ubuntu/Debian nümunəsi (root)
bash /path/to/smartcafe/scripts/vps/install-nginx-login-subdomain.sh login.smartcafe.az
```

Skript: sayt kökü yaradır, Nginx `server` bloku yazar, `nginx -t` yoxlayır.

Sonra SSL (Let's Encrypt):

```bash
apt-get update && apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d login.smartcafe.az
```

---

## 4) Cloudflare — SSL rejimi

- Origin-də (VPS-də) **Let's Encrypt** sertifikatı varsa: Cloudflare → **SSL/TLS** → **Full (strict)** tövsiye olunur.
- Əgər origin-də hələ sertifikat yoxdursa: əvvəl **Full** və ya müvəqqəti **Flexible** (yalnız test; prod üçün origin sertifikatı düzəldin).

---

## 5) React build yükləmə (Windows — sizin kompüteriniz)

1. `front\.env.production` — `REACT_APP_DOMAIN_URL=https://login.smartcafe.az` (API ünvanları `api.smartcafe.az` olaraq qalsın).
2. PowerShell (repo kökündən):

```powershell
$env:VPS_HOST = "VPS_IP_BURADA"
$env:VPS_USER = "root"
# SSH açarı varsa:
$env:VPS_KEY  = "$HOME\.ssh\smartcafe_vps"
.\scripts\deploy-vps.ps1
```

Skript build alır, VPS-ə göndərir və faylları **`/var/www/login.smartcafe.az/html`** altına (və ya `VPS_FRONT_ROOT` ilə) yazır.

---

## 6) Laravel API (`.env` VPS-də)

`api.smartcafe.az` harada işləyirsə, oradakı `.env`:

```env
SESSION_DOMAIN=.smartcafe.az
SANCTUM_STATEFUL_DOMAINS=login.smartcafe.az,api.smartcafe.az
CORS_ALLOWED_ORIGINS=https://login.smartcafe.az,https://www.login.smartcafe.az
```

Sonra: `php artisan config:cache`

---

## 7) Yoxlama

- Brauzer: `https://login.smartcafe.az` — login / POS açılmalıdır.
- Cloudflare **Proxied** açdıqdan sonra cache təmizləmək lazım gələ bilər (**Caching** → **Purge Everything** — ehtiyatla).

---

## Siz VPS-ə toxunmadan mən “edə bilərəmmi?”

Yalnız **sizin Windows maşınınızdan** SSH açarı qurulub `.\scripts\deploy-vps.ps1` işlədilərsə, agent burada həmin skripti işlədə bilər. VPS-də Nginx/Certbot **bir dəfə** kimsə (və ya siz tək əmrlə skript) işlətməlidir — bu addım uzaqdan avtomatik deyil, serverə çıxış tələb edir.

Sualınız olsa: VPS əməliyyat sistemi (Ubuntu 22/24?) və Nginx quraşdırılıb-quraşdırılmadığını yazın, əmrləri bir sətirlik ardıcıllığa endirək.
