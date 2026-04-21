param(
    [switch]$Import,
    [switch]$KeepRemote,
    [string]$LocalDb = "restoran",
    [string]$LocalUser = "root",
    [string]$LocalPassword = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Step($t) { Write-Host ""; Write-Host "===== $t =====" -ForegroundColor Cyan }
function Ok($t)   { Write-Host "  [OK] $t" -ForegroundColor Green }
function Warn($t) { Write-Host "  [!]  $t" -ForegroundColor Yellow }

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$dumpFile = "smartcafe_prod_$timestamp.sql"
$localDumpDir = Join-Path $repoRoot "api\storage\db-dumps"
$localDumpPath = Join-Path $localDumpDir $dumpFile

if (-not (Test-Path $localDumpDir)) {
    New-Item -ItemType Directory -Path $localDumpDir -Force | Out-Null
}

Step "Dump on server"
$remoteCmd = "bash -c 'set -e; DBP=`$(grep ^DB_PASSWORD= /var/www/laravel-app/.env | cut -d= -f2 | tr -d `"`"); DBU=`$(grep ^DB_USERNAME= /var/www/laravel-app/.env | cut -d= -f2); DBN=`$(grep ^DB_DATABASE= /var/www/laravel-app/.env | cut -d= -f2); mysqldump --single-transaction --quick --lock-tables=false --default-character-set=utf8mb4 --set-charset -u `$DBU -p`"`$DBP`" `$DBN > /tmp/$dumpFile; du -h /tmp/$dumpFile'"
ssh smartcafe-vps $remoteCmd
if ($LASTEXITCODE -ne 0) {
    Warn "Dump failed"
    exit 1
}
Ok "Dump created"

Step "Download"
$start = Get-Date
scp -i "$HOME\.ssh\smartcafe_vps" "smartcafe-vps:/tmp/$dumpFile" "$localDumpPath"
if ($LASTEXITCODE -ne 0) {
    Warn "Download failed"
    exit 1
}
$elapsed = [math]::Round(((Get-Date) - $start).TotalSeconds, 1)
$size = [math]::Round((Get-Item $localDumpPath).Length / 1MB, 1)
Ok "Downloaded $size MB in ${elapsed}s"
Write-Host "  File: $localDumpPath"

if (-not $KeepRemote) {
    ssh smartcafe-vps "rm /tmp/$dumpFile"
    Ok "Cleaned remote"
}

if ($Import) {
    Step "Import to local MySQL"
    $mysqlPath = $null
    $candidates = @(
        "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe",
        "C:\xampp\mysql\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $mysqlPath = $c; break }
    }
    if (-not $mysqlPath) {
        $laragonGlob = Get-ChildItem "C:\laragon\bin\mysql\mysql-*\bin\mysql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($laragonGlob) { $mysqlPath = $laragonGlob.FullName }
    }
    if (-not $mysqlPath) {
        try { $mysqlPath = (Get-Command mysql.exe -ErrorAction Stop).Source } catch {}
    }
    if (-not $mysqlPath) {
        Warn "mysql.exe not found in PATH"
        Write-Host "  Import manually: mysql -u $LocalUser -p $LocalDb < `"$localDumpPath`""
        exit 0
    }

    Write-Host "  Using: $mysqlPath"
    $createArgs = @("-u", $LocalUser)
    if ($LocalPassword) { $createArgs += "-p$LocalPassword" }
    $createArgs += @("-e", "CREATE DATABASE IF NOT EXISTS $LocalDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    & $mysqlPath @createArgs

    $importStart = Get-Date

    # PowerShell'in Get-Content'i varsayılan ANSI ile oxuyur və UTF-8 datanı korrupte edir.
    # cmd /c ilə binary redirect edirik, beləcə mysql.exe fayldakı utf8mb4 baytları birbaşa alır.
    $pwdArg = if ($LocalPassword) { "-p$LocalPassword " } else { "" }
    $cmdLine = "`"$mysqlPath`" --default-character-set=utf8mb4 -u $LocalUser $pwdArg$LocalDb < `"$localDumpPath`""
    & cmd /c $cmdLine
    if ($LASTEXITCODE -eq 0) {
        $importElapsed = [math]::Round(((Get-Date) - $importStart).TotalSeconds, 1)
        Ok "Imported to local DB '$LocalDb' in ${importElapsed}s"
    } else {
        Warn "Import failed"
    }
}

Write-Host ""
Write-Host "Dump: $localDumpPath" -ForegroundColor Green
