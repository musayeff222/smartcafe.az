$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$apiDir   = Join-Path $repoRoot "api"
$dbFile   = Join-Path $apiDir "database\database.sqlite"

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

$php = Get-PhpExe
if (-not $php) {
    Write-Host "PHP tapilmadi. Laragon + Add to Windows Path." -ForegroundColor Red
    exit 1
}

$dbParent = Split-Path $dbFile
if (-not (Test-Path $dbParent)) {
    New-Item -ItemType Directory -Path $dbParent -Force | Out-Null
}
if (-not (Test-Path $dbFile)) {
    New-Item -ItemType File -Path $dbFile -Force | Out-Null
}

Push-Location $apiDir
try {
    & $php artisan config:clear
    & $php artisan migrate --force
    Write-Host "[OK] SQLite + migrate" -ForegroundColor Green
} finally {
    Pop-Location
}
