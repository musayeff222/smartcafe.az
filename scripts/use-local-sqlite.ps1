# Lokal test: canli MySQL / SSH tunel olmadan SQLite ile isleyir.
# Istifade: .\scripts\use-local-sqlite.ps1
param([switch]$SkipSeed)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$apiDir   = Join-Path $repoRoot "api"
$envFile  = Join-Path $apiDir ".env"
$sqlite   = Join-Path $apiDir "database\database.sqlite"

function Set-EnvLine {
    param([string]$Path, [string]$Key, [string]$Value)
    $newLine = "${Key}=${Value}"
    if (-not (Test-Path $Path)) { Add-Content -Path $Path -Value $newLine -Encoding UTF8; return }
    $lines = @(Get-Content $Path -ErrorAction SilentlyContinue)
    $found = $false
    $out = foreach ($line in $lines) {
        if ($line -match ("^\s*" + [regex]::Escape($Key) + "\s*=")) { $newLine; $found = $true }
        else { $line }
    }
    if (-not $found) { $out += $newLine }
    $out | Set-Content -Path $Path -Encoding UTF8
}

Write-Host "`n===== Lokal SQLite (canli MySQL yox) =====" -ForegroundColor Cyan

if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $apiDir ".env.example") $envFile
    Write-Host "[OK] api/.env yaradildi (.env.example)" -ForegroundColor Green
}

$bak = Join-Path $apiDir ".env.mysql.bak"
if (-not (Test-Path $bak)) {
    Copy-Item $envFile $bak -Force
    Write-Host "[OK] Kohne .env saxlanildi: api/.env.mysql.bak" -ForegroundColor Green
}

if (-not (Test-Path $sqlite)) {
    New-Item -ItemType File -Path $sqlite -Force | Out-Null
}

Set-EnvLine $envFile "DB_CONNECTION" "sqlite"
Set-EnvLine $envFile "DB_DATABASE" $sqlite.Replace('\', '/')
Set-EnvLine $envFile "SESSION_DRIVER" "file"
Set-EnvLine $envFile "CACHE_STORE" "array"
Set-EnvLine $envFile "QUEUE_CONNECTION" "sync"

$phpCmd = Get-Command php -ErrorAction SilentlyContinue
$php = if ($phpCmd) { $phpCmd.Source } else { $null }
if (-not $php) { Write-Host "php tapilmadi (Laragon / PATH)." -ForegroundColor Red; exit 1 }

Push-Location $apiDir
try {
    & $php artisan config:clear | Out-Null
    & $php artisan migrate --force
    if (-not $SkipSeed) {
        & $php artisan db:seed --force
    }
    & $php artisan db:show
} finally { Pop-Location }

Write-Host "`n[OK] Lokal baza hazirdir." -ForegroundColor Green
Write-Host "Front: http://localhost:3001" -ForegroundColor Yellow
Write-Host "API:   http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Giris: DatabaseSeeder.php icindeki email/parol (lokal test istifadecisi)." -ForegroundColor Yellow
Write-Host "Canli MySQL-e qayitmaq: api/.env.mysql.bak -> api/.env ve START_FULL_DEV.bat`n" -ForegroundColor DarkGray
