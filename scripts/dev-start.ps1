param(
    [ValidateSet("all","api","front","mysql","stop")]
    [string]$Only = "all"
)

$ErrorActionPreference = "Continue"
$repoRoot = Split-Path -Parent $PSScriptRoot
$apiDir   = Join-Path $repoRoot "api"
$frontDir = Join-Path $repoRoot "front"

$mysqlDir    = "C:\laragon\bin\mysql\mysql-8.4.3-winx64"
$mysqlConfig = "C:\laragon\etc\my.ini"
$phpDir      = "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64"

function TestPort($port) {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.SendTimeout = 1000
    try { $tcp.Connect("127.0.0.1", $port); $tcp.Close(); return $true } catch { return $false }
}

function StopPort($port) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue }
    } catch {}
}

# ---------- STOP MODE ----------
if ($Only -eq "stop") {
    Write-Host "Stopping dev servers..." -ForegroundColor Yellow
    StopPort 3000
    StopPort 8000
    Get-Process node, php -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -gt (Get-Date).AddHours(-24) } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "API and Frontend stopped (MySQL still running)" -ForegroundColor Green
    Write-Host "To also stop MySQL: Get-Process mysqld | Stop-Process -Force" -ForegroundColor Gray
    exit 0
}

# ---------- MYSQL ----------
if ($Only -eq "all" -or $Only -eq "mysql") {
    Write-Host "`n===== MySQL =====" -ForegroundColor Cyan
    if (TestPort 3306) {
        Write-Host "  MySQL already running on port 3306" -ForegroundColor Green
    } else {
        if (-not (Test-Path "$mysqlDir\bin\mysqld.exe")) {
            Write-Host "  ERROR: mysqld.exe not found at $mysqlDir" -ForegroundColor Red
            exit 1
        }
        Write-Host "  Starting MySQL..." -ForegroundColor Yellow
        Start-Process -FilePath "$mysqlDir\bin\mysqld.exe" -ArgumentList "--defaults-file=$mysqlConfig" -WindowStyle Hidden
        for ($i = 0; $i -lt 30; $i++) {
            Start-Sleep -Seconds 1
            if (TestPort 3306) { break }
        }
        if (TestPort 3306) {
            Write-Host "  MySQL ready on 127.0.0.1:3306" -ForegroundColor Green
        } else {
            Write-Host "  MySQL did not start. Check C:\laragon\data\mysql-error.log" -ForegroundColor Red
            exit 1
        }
    }
}

# ---------- API ----------
if ($Only -eq "all" -or $Only -eq "api") {
    Write-Host "`n===== Laravel API =====" -ForegroundColor Cyan

    if (TestPort 8000) {
        Write-Host "  Port 8000 already in use - killing old process" -ForegroundColor Yellow
        StopPort 8000
        Start-Sleep -Seconds 2
    }

    if (-not (Test-Path "$apiDir\.env")) {
        Write-Host "  WARNING: api/.env missing - run initial setup first" -ForegroundColor Red
    }

    Write-Host "  Opening new window on http://127.0.0.1:8000 ..." -ForegroundColor Green
    $apiCmd = "`$env:Path = '$phpDir;' + `$env:Path; cd '$apiDir'; Write-Host ''; Write-Host '===== Laravel API =====' -ForegroundColor Green; Write-Host 'http://127.0.0.1:8000' -ForegroundColor Cyan; Write-Host 'Close this window to stop' -ForegroundColor Yellow; Write-Host ''; php artisan serve"
    Start-Process powershell -ArgumentList "-NoExit","-Command",$apiCmd
    Start-Sleep -Seconds 2
}

# ---------- FRONTEND ----------
if ($Only -eq "all" -or $Only -eq "front") {
    Write-Host "`n===== React Frontend =====" -ForegroundColor Cyan

    if (TestPort 3000) {
        Write-Host "  Port 3000 already in use - killing old process" -ForegroundColor Yellow
        StopPort 3000
        Start-Sleep -Seconds 2
    }

    if (-not (Test-Path "$frontDir\.env.local")) {
        Write-Host "  Creating front/.env.local with localhost URLs..." -ForegroundColor Yellow
        @"
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api
REACT_APP_IMG_BASE_URL=http://127.0.0.1:8000/storage
REACT_APP_DOMAIN_URL=http://localhost:3000
"@ | Set-Content -Path "$frontDir\.env.local" -Encoding UTF8
    }

    Write-Host "  Opening new window on http://localhost:3000 ..." -ForegroundColor Green
    Write-Host "  (first compile takes ~30-60 sec)" -ForegroundColor Yellow
    $frontCmd = "cd '$frontDir'; Write-Host ''; Write-Host '===== React Frontend =====' -ForegroundColor Green; Write-Host 'http://localhost:3000' -ForegroundColor Cyan; Write-Host 'Close this window to stop' -ForegroundColor Yellow; Write-Host ''; npm start"
    Start-Process powershell -ArgumentList "-NoExit","-Command",$frontCmd
}

# ---------- FINAL STATUS ----------
if ($Only -eq "all") {
    Write-Host "`n==================================================" -ForegroundColor Green
    Write-Host "  DEV SERVERS STARTING" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  API:       http://127.0.0.1:8000" -ForegroundColor Cyan
    Write-Host "  MySQL:     127.0.0.1:3306 (background)" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Browser otomatik acilacak birkac saniye icinde." -ForegroundColor Yellow
    Write-Host "  React window'da 'Compiled successfully!' yazisini bekleyin." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Durdurmak icin:  .\scripts\dev-start.ps1 -Only stop" -ForegroundColor Gray
}
