# Yerel build + VPS'e yükleme (Windows PowerShell)
# Kullanım: .\scripts\deploy-vps.ps1
# İsteğe bağlı: $env:VPS_HOST, $env:VPS_USER, $env:VPS_KEY

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

$VpsHost = if ($env:VPS_HOST) { $env:VPS_HOST } else { "76.13.136.137" }
$VpsUser = if ($env:VPS_USER) { $env:VPS_USER } else { "root" }
$Key = if ($env:VPS_KEY) { $env:VPS_KEY } else { "$HOME\.ssh\smartcafe_vps" }
$SshTarget = "${VpsUser}@${VpsHost}"

$sshArgs = @()
if (Test-Path $Key) { $sshArgs = @("-i", $Key, "-o", "StrictHostKeyChecking=accept-new") }

function Invoke-RemoteScript([string]$Script) {
    $Script = $Script -replace "`r`n", "`n"
    $Script | & ssh @sshArgs "${VpsUser}@${VpsHost}" "bash -s"
    if ($LASTEXITCODE -ne 0) { throw "SSH remote script failed" }
}

Write-Host "=== 1/4 Frontend build ===" -ForegroundColor Cyan
Push-Location "$Root\front"
if (-not (Test-Path ".env.production")) {
    Write-Host "UYARI: front\.env.production yok - .env.example kopyalayın ve production URL'lerini girin." -ForegroundColor Yellow
}
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm build failed" }
Pop-Location

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$tar = Join-Path $env:TEMP "smartcafe-deploy-$stamp.tgz"

Write-Host "=== 2/4 Paket (vendor ve .env haric) ===" -ForegroundColor Cyan
Push-Location $Root
if (-not (Test-Path "front\build\index.html")) { throw "front/build yok - once npm run build" }
& tar.exe -czf $tar `
    --exclude="api/vendor" `
    --exclude="api/.env" `
    api `
    front/build
if ($LASTEXITCODE -ne 0) { throw "tar failed" }
Pop-Location

Write-Host "=== 3/4 SCP -> VPS /tmp ===" -ForegroundColor Cyan
& scp @sshArgs $tar "${SshTarget}:/tmp/smartcafe-deploy.tgz"
if ($LASTEXITCODE -ne 0) { throw "scp failed" }

Write-Host "=== 4/4 Uzak kurulum ===" -ForegroundColor Cyan
$remote = @'
set -e
cd /tmp
rm -rf smartcafe-deploy && mkdir smartcafe-deploy && tar -xzf smartcafe-deploy.tgz -C smartcafe-deploy
# api
rsync -a --delete smartcafe-deploy/api/ /var/www/laravel-app/ 2>/dev/null || {
  cp -a smartcafe-deploy/api/. /var/www/laravel-app/
}
# frontend static
rm -rf /var/www/smartcafe-frontend/*
cp -a smartcafe-deploy/front/build/. /var/www/smartcafe-frontend/
chown -R www-data:www-data /var/www/smartcafe-frontend /var/www/laravel-app/storage /var/www/laravel-app/bootstrap/cache
cd /var/www/laravel-app
export COMPOSER_ALLOW_SUPERUSER=1
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan config:cache
php artisan route:cache
rm -rf /tmp/smartcafe-deploy /tmp/smartcafe-deploy.tgz
echo DONE
'@
Invoke-RemoteScript $remote

Remove-Item $tar -Force -ErrorAction SilentlyContinue
Write-Host "Tamamlandı: https://smartcafe.az" -ForegroundColor Green
