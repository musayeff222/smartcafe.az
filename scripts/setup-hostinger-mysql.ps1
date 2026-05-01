# Hostinger (və ya digər) uzaq MySQL-i api/.env-ə yazır.
# Parol repoya düşmür — yalnız öz kompüterində işlədirsiniz.
param(
    [string]$DbHost,
    [string]$DbName,
    [string]$DbUser,
    [string]$DbPassword,
    [int]$DbPort = 3306
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$apiDir   = Join-Path $repoRoot "api"
$envFile  = Join-Path $apiDir ".env"
$example  = Join-Path $apiDir ".env.example"

function Get-PhpExe {
    $cmd = Get-Command php -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $laragonPhp = "C:\laragon\bin\php"
    if (Test-Path $laragonPhp) {
        foreach ($d in (Get-ChildItem $laragonPhp -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending)) {
            $exe = Join-Path $d.FullName "php.exe"
            if (Test-Path $exe) { return $exe }
        }
    }
    return $null
}

function Set-EnvLine {
    param(
        [string]$Path,
        [string]$Key,
        [string]$Value,
        [switch]$QuoteValue
    )
    $escaped = if ($QuoteValue) { '"' + ($Value -replace '"', '\"') + '"' } else { $Value }
    $newLine = "${Key}=${escaped}"
    if (-not (Test-Path $Path)) {
        Add-Content -Path $Path -Value $newLine -Encoding UTF8
        return
    }
    $lines = @(Get-Content $Path -ErrorAction SilentlyContinue)
    $found = $false
    $out = foreach ($line in $lines) {
        if ($line -match ("^\s*" + [regex]::Escape($Key) + "\s*=")) {
            $newLine
            $found = $true
        } else {
            $line
        }
    }
    if (-not $found) { $out += $newLine }
    $out | Set-Content -Path $Path -Encoding UTF8
}

Write-Host "`n===== Uzaq MySQL -> api/.env =====" -ForegroundColor Cyan
Write-Host "Serverdeki 127.0.0.1 yalniz server ozunde isleyir; komputerden HPANEL Remote MySQL hostunu yaz.`n" -ForegroundColor Yellow

if (-not $DbHost) { $DbHost = Read-Host "DB_HOST (hPanel MySQL host, ms. srv....hstgr.io)" }
if (-not $DbName) { $DbName = Read-Host "DB_DATABASE" }
if (-not $DbUser) { $DbUser = Read-Host "DB_USERNAME" }
if (-not $DbPassword) {
    $sec = Read-Host "DB_PASSWORD" -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    try { $DbPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

if ([string]::IsNullOrWhiteSpace($DbHost) -or [string]::IsNullOrWhiteSpace($DbName) -or [string]::IsNullOrWhiteSpace($DbUser)) {
    Write-Host "DB_HOST, DB_DATABASE, DB_USERNAME vacibdir." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $envFile)) {
    if (-not (Test-Path $example)) {
        Write-Host "api/.env.example tapilmadi." -ForegroundColor Red
        exit 1
    }
    Copy-Item $example $envFile
    Write-Host "[OK] api/.env yaradildi" -ForegroundColor Green
    $phpKey = Get-PhpExe
    if ($phpKey) {
        Push-Location $apiDir
        try { & $phpKey artisan key:generate --force 2>&1 | Out-Null } finally { Pop-Location }
        Write-Host "[OK] APP_KEY" -ForegroundColor Green
    } else {
        Write-Host "[!] Sonra: cd api; php artisan key:generate" -ForegroundColor Yellow
    }
}

Set-EnvLine $envFile "APP_ENV" "local"
Set-EnvLine $envFile "APP_DEBUG" "true"
Set-EnvLine $envFile "APP_URL" "http://127.0.0.1:8000"
Set-EnvLine $envFile "DB_CONNECTION" "mysql"
Set-EnvLine $envFile "DB_HOST" $DbHost
Set-EnvLine $envFile "DB_PORT" "$DbPort"
Set-EnvLine $envFile "DB_DATABASE" $DbName
Set-EnvLine $envFile "DB_USERNAME" $DbUser
Set-EnvLine $envFile "DB_PASSWORD" $DbPassword -QuoteValue

Set-EnvLine $envFile "SESSION_DRIVER" "file"
Set-EnvLine $envFile "CACHE_STORE" "array"
Set-EnvLine $envFile "QUEUE_CONNECTION" "sync"

if (-not (Select-String -Path $envFile -Pattern "^\s*CORS_ALLOWED_ORIGINS\s*=" -Quiet)) {
    Set-EnvLine $envFile "CORS_ALLOWED_ORIGINS" "http://localhost:3000,http://127.0.0.1:3000"
}
if (-not (Select-String -Path $envFile -Pattern "^\s*CORS_SUPPORTS_CREDENTIALS\s*=" -Quiet)) {
    Set-EnvLine $envFile "CORS_SUPPORTS_CREDENTIALS" "false"
}

Write-Host "`n[OK] api/.env yenilendi." -ForegroundColor Green

$php = Get-PhpExe
if (-not $php) {
    Write-Host "`nphp tapilmadi — https://laragon.org (Full) + Add to Windows Path" -ForegroundColor Red
    exit 0
}

Push-Location $apiDir
try {
    & $php artisan config:clear
    & $php artisan db:show
    if ($LASTEXITCODE -ne 0) {
        Write-Host "db:show exit $LASTEXITCODE — migrate:status sinayiriq..." -ForegroundColor Yellow
        & $php artisan migrate:status
    }
    Write-Host "`n[OK] Qoşulma testi. API: .\scripts\dev-start.ps1 -Only api" -ForegroundColor Green
} catch {
    Write-Host "`nXeta: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Yoxla: hPanel Remote MySQL + IP whitelist, DB_HOST, parol." -ForegroundColor Yellow
    exit 1
} finally {
    Pop-Location
}
