# Yerel build + VPS (Windows PowerShell)
#
# Seçimlər:
#   .\scripts\deploy-vps.ps1                    → API + Front + migrate (köhnə davranış; marketing yox)
#   .\scripts\deploy-vps.ps1 -Choose              → menyu ilə seç
#   .\scripts\deploy-vps.ps1 -Api -Front        → yalnız seçilənlər
#   .\scripts\deploy-vps.ps1 -All               → API + Front + Marketing + migrate
#
# Mühit: VPS_HOST, VPS_USER, VPS_KEY, VPS_FRONT_ROOT, VPS_MARKETING_ROOT

[CmdletBinding()]
param(
    [switch] $Api,
    [switch] $Front,
    [switch] $Marketing,
    [switch] $Migrate,
    [switch] $All,
    [switch] $Choose
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

$VpsHost = if ($env:VPS_HOST) { $env:VPS_HOST } else { "76.13.136.137" }
$VpsUser = if ($env:VPS_USER) { $env:VPS_USER } else { "root" }
$Key = if ($env:VPS_KEY) { $env:VPS_KEY } else { "$HOME\.ssh\smartcafe_vps" }
$VpsFrontRoot = if ($env:VPS_FRONT_ROOT) { $env:VPS_FRONT_ROOT } else { "/var/www/login.smartcafe.az/html" }
$VpsMarketingRoot = if ($env:VPS_MARKETING_ROOT) { $env:VPS_MARKETING_ROOT } else { "/var/www/smartcafe-frontend" }
$SshTarget = "${VpsUser}@${VpsHost}"

$sshArgs = @()
if (Test-Path $Key) { $sshArgs = @("-i", $Key, "-o", "StrictHostKeyChecking=accept-new") }

function Invoke-RemoteScript([string]$Script) {
    $Script = $Script -replace "`r`n", "`n"
    $Script | & ssh @sshArgs "${VpsUser}@${VpsHost}" "bash -s"
    if ($LASTEXITCODE -ne 0) { throw "SSH remote script failed" }
}

if ($Choose) {
    Write-Host ""
    Write-Host "  Canliya ne gonderilsin?" -ForegroundColor Cyan
    Write-Host "  1) API + React (login) + migrate + cache   [standart]"
    Write-Host "  2) Yalniz API (kod, composer, migrate, cache)"
    Write-Host "  3) Yalniz React build (login.smartcafe.az)"
    Write-Host "  4) Yalniz marketing (smartcafe.az statik)"
    Write-Host "  5) Yalniz migrate + cache (kod deyismez)"
    Write-Host "  6) Hamisi: API + React + marketing + migrate"
    Write-Host ""
    $c = Read-Host "Secim (1-6)"
    switch ($c) {
        "1" { $Api = $true; $Front = $true; $Migrate = $true }
        "2" { $Api = $true; $Migrate = $true }
        "3" { $Front = $true }
        "4" { $Marketing = $true }
        "5" { $Migrate = $true }
        "6" { $All = $true }
        default { Write-Host "Etibarsiz secim - cixilir." -ForegroundColor Red; exit 1 }
    }
}

$explicit = $Api -or $Front -or $Marketing -or $Migrate -or $All
if ($All) {
    $Api = $true; $Front = $true; $Marketing = $true; $Migrate = $true
}
elseif (-not $explicit) {
    $Api = $true; $Front = $true; $Migrate = $true
}

Write-Host ""
Write-Host "Deploy paketi: API=$Api  Front=$Front  Marketing=$Marketing  Migrate=$Migrate" -ForegroundColor Yellow
Write-Host "VPS: $SshTarget | FRONT_ROOT=$VpsFrontRoot | MARKETING_ROOT=$VpsMarketingRoot"
Write-Host ""

if ($Front) {
    Write-Host "=== Frontend build ===" -ForegroundColor Cyan
    Push-Location "$Root\front"
    if (-not (Test-Path ".env.production")) {
        Write-Host "UYARI: front\.env.production yoxdur." -ForegroundColor Yellow
    }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm build failed" }
    Pop-Location
    if (-not (Test-Path "$Root\front\build\index.html")) { throw "front/build yoxdur" }
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$tarApi = Join-Path $env:TEMP "smartcafe-api-$stamp.tgz"
$tarStatic = Join-Path $env:TEMP "smartcafe-static-$stamp.tgz"

Write-Host "=== Arxiv (tar) ===" -ForegroundColor Cyan
$staticItems = @()
if ($Front) { $staticItems += "front/build" }
if ($Marketing) { $staticItems += "marketing" }

if ($Migrate -and -not ($Api -or $Front -or $Marketing)) {
    Write-Host "=== Yalniz migrate (fayl paketi yox) ===" -ForegroundColor Cyan
    $remoteMigrate = @'
set -e
cd /var/www/laravel-app
php artisan migrate --force
php artisan config:cache
php artisan route:cache
echo DONE_MIGRATE
'@
    Invoke-RemoteScript $remoteMigrate
    Write-Host "OK: migrate + cache" -ForegroundColor Green
    exit 0
}

if (-not $Api -and ($staticItems.Count -eq 0)) {
    Write-Host "Hech bir paket secilmedi." -ForegroundColor Red
    exit 1
}

Push-Location $Root
if ($Api) {
    $apiArgs = @("-czf", $tarApi) + @("--exclude=api/vendor", "--exclude=api/.env", "api")
    & tar.exe @apiArgs
    if ($LASTEXITCODE -ne 0) { throw "tar api failed" }
}
if ($staticItems.Count -gt 0) {
    $stArgs = @("-czf", $tarStatic) + $staticItems
    & tar.exe @stArgs
    if ($LASTEXITCODE -ne 0) { throw "tar static failed" }
    if ($Front) {
        $hf = & tar.exe -tzf $tarStatic 2>$null | Select-String -Pattern "^front/build" -Quiet
        if (-not $hf) { throw "static arxivinde front/build yoxdur" }
    }
}
Pop-Location

Write-Host "=== Kohne arxivleri sil (VPS /tmp) ===" -ForegroundColor Cyan
Invoke-RemoteScript "rm -f /tmp/smartcafe-api.tgz /tmp/smartcafe-static.tgz /tmp/smartcafe-deploy.tgz"

Write-Host "=== SCP -> VPS /tmp ===" -ForegroundColor Cyan
if ($Api) {
    & scp @sshArgs $tarApi "${SshTarget}:/tmp/smartcafe-api.tgz"
    if ($LASTEXITCODE -ne 0) { throw "scp api failed" }
}
if ($staticItems.Count -gt 0) {
    & scp @sshArgs $tarStatic "${SshTarget}:/tmp/smartcafe-static.tgz"
    if ($LASTEXITCODE -ne 0) { throw "scp static failed" }
}

$fr = $VpsFrontRoot.Replace("'", "'\''")
$mr = $VpsMarketingRoot.Replace("'", "'\''")
$da = if ($Api) { "1" } else { "0" }
$df = if ($Front) { "1" } else { "0" }
$dm = if ($Marketing) { "1" } else { "0" }
# API deploy edilende migrasiya adeten lazimdir
$dmg = if ($Migrate -or $Api) { "1" } else { "0" }

Write-Host "=== Uzak qurasdirma ===" -ForegroundColor Cyan
$remoteTpl = @'
set -e
export DEPLOY_API=__DA__
export DEPLOY_FRONT=__DF__
export DEPLOY_MARKETING=__DM__
export DEPLOY_MIGRATE=__DMG__
export FRONT_ROOT=__FR__
export MARKETING_ROOT=__MR__
cd /tmp
rm -rf smartcafe-deploy
mkdir -p smartcafe-deploy
if [[ -f smartcafe-api.tgz ]]; then
  tar -xzf smartcafe-api.tgz -C smartcafe-deploy
fi
if [[ -f smartcafe-static.tgz ]]; then
  tar -xzf smartcafe-static.tgz -C smartcafe-deploy
fi
# API bloku cd /var/www/laravel-app edir; bu yollar mutleq /tmp olmalidir
SD=/tmp/smartcafe-deploy
if [[ "$DEPLOY_API" == "1" ]]; then
  # .env deploy paketine daxil edilmir (secrets). Deploy zamani hec vaxt silinmesin.
  # Qeyd: rsync --delete storage/app/public (sekiller) kimi runtime fayllari silmesin.
  rsync -a --delete \
    --exclude='.env' --exclude='.env.*' \
    --exclude='storage/app/public/***' \
    --exclude='public/storage' \
    "$SD/api/" /var/www/laravel-app/ 2>/dev/null || cp -a "$SD/api/." /var/www/laravel-app/
  if [[ ! -f /var/www/laravel-app/.env ]]; then
    echo ""
    echo "XETA: /var/www/laravel-app/.env yoxdur (deploy paketi .env gondermir)."
    echo "  ssh ile sunucuda:"
    echo "    cp /var/www/laravel-app/.env.hostinger.example /var/www/laravel-app/.env"
    echo "    nano /var/www/laravel-app/.env   # DB_DATABASE DB_USERNAME DB_PASSWORD doldurun"
    echo "    cd /var/www/laravel-app && php artisan key:generate --force && php artisan migrate --force"
    echo ""
    exit 1
  fi
  chown -R www-data:www-data /var/www/laravel-app/storage /var/www/laravel-app/bootstrap/cache
  cd /var/www/laravel-app
  export COMPOSER_ALLOW_SUPERUSER=1
  composer install --no-dev --optimize-autoloader --no-interaction
  # storage link + permissions (sekiller ve upload-lar ucun)
  php artisan storage:link >/dev/null 2>&1 || true
  chown -R www-data:www-data /var/www/laravel-app/storage/app/public /var/www/laravel-app/public/storage 2>/dev/null || true
  chmod -R u+rwX,go+rX,go-w /var/www/laravel-app/storage/app/public /var/www/laravel-app/public/storage 2>/dev/null || true
fi
if [[ "$DEPLOY_FRONT" == "1" ]]; then
  mkdir -p "$FRONT_ROOT"
  rm -rf "$FRONT_ROOT"/*
  cp -a "$SD/front/build/." "$FRONT_ROOT"/
  chown -R www-data:www-data "$FRONT_ROOT"
fi
if [[ "$DEPLOY_MARKETING" == "1" ]]; then
  mkdir -p "$MARKETING_ROOT"
  rm -rf "$MARKETING_ROOT"/*
  cp -a "$SD/marketing/." "$MARKETING_ROOT"/
  chown -R www-data:www-data "$MARKETING_ROOT"
fi
if [[ "$DEPLOY_MIGRATE" == "1" ]]; then
  cd /var/www/laravel-app
  php artisan migrate --force
  php artisan config:cache
  php artisan route:cache
fi
rm -rf /tmp/smartcafe-deploy /tmp/smartcafe-api.tgz /tmp/smartcafe-static.tgz
echo DONE
'@
$remote = $remoteTpl `
    -replace '__DA__', $da `
    -replace '__DF__', $df `
    -replace '__DM__', $dm `
    -replace '__DMG__', $dmg `
    -replace '__FR__', $fr `
    -replace '__MR__', $mr

Invoke-RemoteScript $remote

Remove-Item $tarApi -Force -ErrorAction SilentlyContinue
Remove-Item $tarStatic -Force -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "OK tamamlandi." -ForegroundColor Green
if ($Front) { Write-Host "  React: https://login.smartcafe.az  ($VpsFrontRoot)" }
if ($Marketing) { Write-Host "  Marketing: $VpsMarketingRoot (nginx root ile uygunlasdirin)" }
if ($Api -or $Migrate) { Write-Host "  API: /var/www/laravel-app" }
