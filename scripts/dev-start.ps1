# ============================================================
# Start local dev servers (Laravel + React)
# ============================================================
# KullanД±m:
#   .\scripts\dev-start.ps1              в†’ iki terminal aГ§ar: API (8000) + frontend (3000)
#   .\scripts\dev-start.ps1 -Only api    в†’ sadece backend
#   .\scripts\dev-start.ps1 -Only front  в†’ sadece frontend
# ============================================================

param(
    [ValidateSet("all","api","front")]
    [string]$Only = "all"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$apiDir   = Join-Path $repoRoot "api"
$frontDir = Join-Path $repoRoot "front"

# Check prerequisites
if ($Only -ne "front") {
    $php = Get-Command php -ErrorAction SilentlyContinue
    if (-not $php) {
        Write-Host "PHP not found in PATH." -ForegroundColor Red
        Write-Host "Install Laragon (https://laragon.org) or add PHP to PATH." -ForegroundColor Yellow
        exit 1
    }
}
if ($Only -ne "api") {
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        Write-Host "Node.js not found." -ForegroundColor Red
        exit 1
    }
}

# Ensure .env.local exists for frontend (localhost URLs)
if ($Only -ne "api") {
    $envLocal = Join-Path $frontDir ".env.local"
    if (-not (Test-Path $envLocal)) {
        Write-Host "Creating front/.env.local with localhost URLs..." -ForegroundColor Yellow
        @"
# Local development env (git-ignored)
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api
REACT_APP_IMG_BASE_URL=http://127.0.0.1:8000/storage
REACT_APP_DOMAIN_URL=http://localhost:3000
"@ | Set-Content -Path $envLocal -Encoding UTF8
    }
}

# Ensure api/.env exists locally
if ($Only -ne "front") {
    $apiEnv = Join-Path $apiDir ".env"
    if (-not (Test-Path $apiEnv)) {
        Write-Host "Creating api/.env for local dev..." -ForegroundColor Yellow
        $apiKeyPlaceholder = "base64:" + [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 255 }))
        @"
APP_NAME=SmartCafe
APP_ENV=local
APP_KEY=$apiKeyPlaceholder
APP_DEBUG=true
APP_TIMEZONE='Asia/Baku'
APP_URL=http://127.0.0.1:8000

APP_LOCALE=en
APP_FALLBACK_LOCALE=en

APP_MAINTENANCE_DRIVER=file
BCRYPT_ROUNDS=12
LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=debug

# Laragon default MySQL: user=root, no password
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=restoran
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CORS_SUPPORTS_CREDENTIALS=true

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
CACHE_STORE=file

MAIL_MAILER=log
"@ | Set-Content -Path $apiEnv -Encoding UTF8

        Write-Host "  Running artisan key:generate..." -ForegroundColor Yellow
        Push-Location $apiDir
        php artisan key:generate --force
        Pop-Location
    }
}

# Launch
if ($Only -eq "all" -or $Only -eq "api") {
    Write-Host "Starting API at http://127.0.0.1:8000 ..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$apiDir'; Write-Host 'API: http://127.0.0.1:8000' -ForegroundColor Cyan; php artisan serve"
    Start-Sleep -Seconds 2
}

if ($Only -eq "all" -or $Only -eq "front") {
    Write-Host "Starting Frontend at http://localhost:3000 ..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$frontDir'; Write-Host 'Frontend: http://localhost:3000' -ForegroundColor Cyan; npm start"
}

Write-Host ""
Write-Host "Two PowerShell windows should be opening." -ForegroundColor Yellow
Write-Host "Close them to stop the servers." -ForegroundColor Yellow
