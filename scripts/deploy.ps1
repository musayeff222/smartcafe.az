param(
    [string]$Message = "",
    [switch]$SkipFrontend,
    [switch]$SkipComposer,
    [switch]$SkipMigrate,
    [switch]$SkipCommit,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Step($t) { Write-Host ""; Write-Host "===== $t =====" -ForegroundColor Cyan }
function Ok($t)   { Write-Host "  [OK] $t" -ForegroundColor Green }
function Warn($t) { Write-Host "  [!]  $t" -ForegroundColor Yellow }
function Fail($t) { Write-Host "  [X]  $t" -ForegroundColor Red }

Step "Prerequisites"
if (-not (Test-Path "$HOME\.ssh\smartcafe_vps")) {
    Fail "SSH key not found"
    exit 1
}
Ok "SSH key present"

$null = ssh -o ConnectTimeout=5 -o BatchMode=yes smartcafe-vps "true" 2>&1
if ($LASTEXITCODE -ne 0) {
    Fail "Cannot reach smartcafe-vps"
    exit 1
}
Ok "SSH OK"

Step "Git status"
$status = git status --porcelain
if ($status) {
    Write-Host "Uncommitted changes:"
    $status | ForEach-Object { Write-Host "  $_" }

    if (-not $SkipCommit) {
        if ([string]::IsNullOrWhiteSpace($Message)) {
            $Message = Read-Host "Commit message (enter to skip)"
        }
        if ([string]::IsNullOrWhiteSpace($Message)) {
            Warn "No message - skip commit"
        } elseif ($DryRun) {
            Write-Host "[DRY] git commit -m `"$Message`""
        } else {
            git add -A
            git commit -m "$Message"
            Ok "Committed"
        }
    }
} else {
    Ok "Working tree clean"
}

Step "Git push"
$branch = git branch --show-current
Write-Host "  branch: $branch"
if ($DryRun) {
    Write-Host "[DRY] git push origin $branch"
} else {
    git push origin $branch
    Ok "Pushed"
}

Step "Server deploy"
$deployArgs = @()
if ($SkipFrontend) { $deployArgs += "--skip-frontend" }
if ($SkipComposer) { $deployArgs += "--skip-composer" }
if ($SkipMigrate)  { $deployArgs += "--skip-migrate" }
$deployCmd = "smartcafe-deploy " + ($deployArgs -join " ")
Write-Host "  On server: $deployCmd"

if ($DryRun) {
    Write-Host "[DRY] ssh smartcafe-vps `"$deployCmd`""
    exit 0
}

$startTime = Get-Date
ssh smartcafe-vps $deployCmd
$elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Ok "Deploy done in ${elapsed}s"
    Write-Host ""
    Write-Host "  Frontend: https://smartcafe.az/" -ForegroundColor Cyan
    Write-Host "  API:      https://api.smartcafe.az/" -ForegroundColor Cyan
} else {
    Fail "Deploy failed"
    Write-Host "  View logs: ssh smartcafe-vps 'tail -f /var/www/laravel-app/storage/logs/laravel.log'"
    exit 1
}
