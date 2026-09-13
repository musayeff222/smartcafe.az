# Canli MySQL (VPS SSH tunnel: 127.0.0.1:3306)
# Evvel START_FULL_DEV.bat ve ya SSH tunel aciq olmalidir.
param([switch]$SkipDbTest)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$apiDir   = Join-Path $repoRoot "api"
$envFile  = Join-Path $apiDir ".env"
$bak      = Join-Path $apiDir ".env.mysql.bak"

function Test-MySqlPort {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $ar = $client.BeginConnect("127.0.0.1", 3306, $null, $null)
        if (-not $ar.AsyncWaitHandle.WaitOne(1500)) { return $false }
        $client.EndConnect($ar)
        return $client.Connected
    } catch { return $false }
    finally { try { $client.Close() } catch { } }
}

Write-Host ""
Write-Host "===== Canli MySQL (.env) =====" -ForegroundColor Cyan

if (-not (Test-Path $bak)) {
    Write-Host "[X] api/.env.mysql.bak yoxdur." -ForegroundColor Red
    Write-Host "    setup-hostinger-mysql.ps1 ve ya evvelki backup lazimdir." -ForegroundColor Yellow
    exit 1
}

Copy-Item $bak $envFile -Force
Write-Host "[OK] api/.env berpa edildi (MySQL)" -ForegroundColor Green

if (-not (Test-MySqlPort)) {
    $tunnelScript = Join-Path $PSScriptRoot "start-mysql-tunnel.ps1"
    if (Test-Path $tunnelScript) {
        & powershell -NoProfile -ExecutionPolicy Bypass -File $tunnelScript
    }
}

if (-not (Test-MySqlPort)) {
    Write-Host "[!] 127.0.0.1:3306 bagli deyil - SSH tunel lazimdir." -ForegroundColor Yellow
    Write-Host "    START_FULL_DEV.bat isledin; SSH-MySQL-Tunnel penceresi aciq qalsin." -ForegroundColor Yellow
    exit 2
}

$phpCmd = Get-Command php -ErrorAction SilentlyContinue
if (-not $phpCmd) {
    Write-Host "[!] php tapilmadi." -ForegroundColor Red
    exit 1
}

if ($SkipDbTest) { exit 0 }

Push-Location $apiDir
try {
    & $phpCmd.Source artisan config:clear | Out-Null
    & $phpCmd.Source artisan db:show
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host ""
    Write-Host "[OK] Canli MySQL isleyir." -ForegroundColor Green
} finally { Pop-Location }
