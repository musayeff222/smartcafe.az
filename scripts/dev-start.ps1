param(
    [ValidateSet("all","api","front","mysql","stop")]
    [string]$Only = "all",
    [switch]$Lan
)

$ErrorActionPreference = "Continue"
$repoRoot = Split-Path -Parent $PSScriptRoot
$apiDir   = Join-Path $repoRoot "api"
$frontDir = Join-Path $repoRoot "front"

$mysqlDir    = "C:\laragon\bin\mysql\mysql-8.4.3-winx64"
$mysqlConfig = "C:\laragon\etc\my.ini"
$phpDir      = "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64"

function GetLanIP() {
    $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and
            $_.PrefixOrigin -ne 'WellKnown' -and
            $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL|Docker|Hyper-V|VMware|VirtualBox'
        } |
        Select-Object -First 1 -ExpandProperty IPAddress
    if (-not $ip) {
        $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
            Where-Object { $_.IPAddress -match '^192\.168\.' } |
            Select-Object -First 1 -ExpandProperty IPAddress
    }
    return $ip
}

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

# ---------- LAN MODE SETUP ----------
$lanIp = $null
if ($Lan) {
    $lanIp = GetLanIP
    if (-not $lanIp) {
        Write-Host "ERROR: Could not detect LAN IP. Is WiFi connected?" -ForegroundColor Red
        exit 1
    }
    Write-Host "`n===== LAN Mode =====" -ForegroundColor Magenta
    Write-Host "  Detected LAN IP: $lanIp" -ForegroundColor Cyan

    # 1) Update front/.env.local to point to LAN IP
    $envLocalPath = Join-Path $frontDir ".env.local"
    $envLocalContent = @"
REACT_APP_API_BASE_URL=http://${lanIp}:8000/api
REACT_APP_IMG_BASE_URL=http://${lanIp}:8000/storage
REACT_APP_DOMAIN_URL=http://${lanIp}:3000
"@
    Set-Content -Path $envLocalPath -Value $envLocalContent -Encoding UTF8
    Write-Host "  Updated front/.env.local to use $lanIp" -ForegroundColor Green

    # 2) Update api/.env CORS + Sanctum stateful domains
    $apiEnvPath = Join-Path $apiDir ".env"
    if (Test-Path $apiEnvPath) {
        $apiEnv = Get-Content $apiEnvPath -Raw
        $newCors = "CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://${lanIp}:3000"
        $newSanctum = "SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000,${lanIp}:3000"
        $apiEnv = $apiEnv -replace 'CORS_ALLOWED_ORIGINS=.*', $newCors
        $apiEnv = $apiEnv -replace 'SANCTUM_STATEFUL_DOMAINS=.*', $newSanctum
        Set-Content -Path $apiEnvPath -Value $apiEnv -Encoding UTF8 -NoNewline
        Write-Host "  Updated api/.env CORS + Sanctum for $lanIp" -ForegroundColor Green

        # Clear Laravel config cache so new .env takes effect
        & "$phpDir\php.exe" "$apiDir\artisan" config:clear 2>&1 | Out-Null
        Write-Host "  Cleared Laravel config cache" -ForegroundColor Green
    }

    # 3) Open firewall ports (requires admin; try silently)
    $fwRules = @(
        @{ Name = "SmartCafe Dev Front (3000)"; Port = 3000 },
        @{ Name = "SmartCafe Dev API (8000)";   Port = 8000 }
    )
    foreach ($r in $fwRules) {
        $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
        if (-not $existing) {
            try {
                New-NetFirewallRule -DisplayName $r.Name -Direction Inbound -Protocol TCP -LocalPort $r.Port -Action Allow -Profile Any -ErrorAction Stop | Out-Null
                Write-Host "  Opened firewall port $($r.Port)" -ForegroundColor Green
            } catch {
                Write-Host "  WARN: Could not create firewall rule for port $($r.Port) (run as Admin to auto-open)." -ForegroundColor Yellow
            }
        }
    }
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

    $apiHost = if ($Lan) { "0.0.0.0" } else { "127.0.0.1" }
    $apiUrlDisplay = if ($Lan) { "http://${lanIp}:8000 (LAN) + http://127.0.0.1:8000" } else { "http://127.0.0.1:8000" }
    Write-Host "  Opening new window on $apiUrlDisplay (8 workers) ..." -ForegroundColor Green
    $apiCmd = "`$env:Path = '$phpDir;' + `$env:Path; `$env:PHP_CLI_SERVER_WORKERS = '8'; cd '$apiDir'; Write-Host ''; Write-Host '===== Laravel API (8 workers) =====' -ForegroundColor Green; Write-Host '$apiUrlDisplay' -ForegroundColor Cyan; Write-Host 'Close this window to stop' -ForegroundColor Yellow; Write-Host ''; php artisan serve --host=$apiHost --port=8000"
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

    if (-not (Test-Path "$frontDir\.env.local") -and -not $Lan) {
        Write-Host "  Creating front/.env.local with localhost URLs..." -ForegroundColor Yellow
        @"
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api
REACT_APP_IMG_BASE_URL=http://127.0.0.1:8000/storage
REACT_APP_DOMAIN_URL=http://localhost:3000
"@ | Set-Content -Path "$frontDir\.env.local" -Encoding UTF8
    }

    $frontUrlDisplay = if ($Lan) { "http://${lanIp}:3000 (LAN) + http://localhost:3000" } else { "http://localhost:3000" }
    $hostPrefix = if ($Lan) { "`$env:HOST = '0.0.0.0'; `$env:DANGEROUSLY_DISABLE_HOST_CHECK = 'true'; " } else { "" }
    Write-Host "  Opening new window on $frontUrlDisplay ..." -ForegroundColor Green
    Write-Host "  (first compile takes ~30-60 sec)" -ForegroundColor Yellow
    $frontCmd = "${hostPrefix}cd '$frontDir'; Write-Host ''; Write-Host '===== React Frontend =====' -ForegroundColor Green; Write-Host '$frontUrlDisplay' -ForegroundColor Cyan; Write-Host 'Close this window to stop' -ForegroundColor Yellow; Write-Host ''; npm start"
    Start-Process powershell -ArgumentList "-NoExit","-Command",$frontCmd
}

# ---------- FINAL STATUS ----------
if ($Only -eq "all") {
    Write-Host "`n==================================================" -ForegroundColor Green
    Write-Host "  DEV SERVERS STARTING" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    if ($Lan) {
        Write-Host "  Frontend:  http://${lanIp}:3000   <- TELEFON URUN" -ForegroundColor Magenta
        Write-Host "  API:       http://${lanIp}:8000" -ForegroundColor Cyan
        Write-Host "  (Kompyuterde de http://localhost:3000 isleyir)" -ForegroundColor Gray
    } else {
        Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Cyan
        Write-Host "  API:       http://127.0.0.1:8000" -ForegroundColor Cyan
    }
    Write-Host "  MySQL:     127.0.0.1:3306 (background)" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host ""
    if ($Lan) {
        Write-Host "  TELEFONDAN:" -ForegroundColor Magenta
        Write-Host "  1. Telefon eyni WiFi-ye qosulu olsun" -ForegroundColor Yellow
        Write-Host "  2. Brauzerde: http://${lanIp}:3000" -ForegroundColor Yellow
        Write-Host "  3. 'Compiled successfully' ciksin, sonra yenile" -ForegroundColor Yellow
    } else {
        Write-Host "  Browser otomatik acilacak birkac saniye icinde." -ForegroundColor Yellow
        Write-Host "  React window'da 'Compiled successfully!' yazisini bekleyin." -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "  Durdurmak icin:  .\scripts\dev-start.ps1 -Only stop" -ForegroundColor Gray
}
