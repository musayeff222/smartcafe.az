# SmartCafe API smoke test (local)
$Base = if ($env:API_BASE) { $env:API_BASE } else { "http://127.0.0.1:8000/api" }
$Email = if ($env:TEST_EMAIL) { $env:TEST_EMAIL } else { "admin@example.com" }
$Pass = if ($env:TEST_PASS) { $env:TEST_PASS } else { "password" }

$results = @()
function Test-Endpoint {
    param($Name, $Method, $Url, $Headers = @{})
    try {
        $r = Invoke-WebRequest -Uri $Url -Method $Method -Headers $Headers -UseBasicParsing -TimeoutSec 15
        $ok = $r.StatusCode -ge 200 -and $r.StatusCode -lt 300
        $script:results += [pscustomobject]@{ Name = $Name; Status = $r.StatusCode; OK = $ok }
    } catch {
        $code = 0
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        $script:results += [pscustomobject]@{ Name = $Name; Status = $code; OK = $false }
    }
}

Write-Host "API base: $Base"

$token = $null
try {
    $loginBody = "email=$([uri]::EscapeDataString($Email))&password=$([uri]::EscapeDataString($Pass))"
    $lr = Invoke-WebRequest -Uri "$Base/login" -Method POST -Body $loginBody -ContentType "application/x-www-form-urlencoded" -UseBasicParsing -TimeoutSec 15
    $json = $lr.Content | ConvertFrom-Json
    $token = $json.access_token
    if (-not $token) { $token = $json.token }
    if ($token) {
        $results += [pscustomobject]@{ Name = "POST login"; Status = 200; OK = $true }
    } else {
        $results += [pscustomobject]@{ Name = "POST login"; Status = 200; OK = $false }
    }
} catch {
    $code = 0
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    $results += [pscustomobject]@{ Name = "POST login"; Status = $code; OK = $false }
}

if (-not $token) {
    Write-Host "Login failed. Set TEST_EMAIL and TEST_PASS. Skipping auth routes."
    $results | Format-Table -AutoSize
    exit 1
}

$auth = @{ Authorization = "Bearer $token"; Accept = "application/json" }

@(
    @("GET /me", "$Base/me"),
    @("GET own-restaurants", "$Base/own-restaurants"),
    @("GET tables", "$Base/tables"),
    @("GET payments", "$Base/payments"),
    @("GET restaurant-dashboard", "$Base/restaurant-dashboard?filter=today"),
    @("GET expenses", "$Base/expenses"),
    @("GET expenses/stats", "$Base/expenses/stats"),
    @("GET expenses/grouped", "$Base/expenses/grouped?period=day"),
    @("GET expense-categories", "$Base/expense-categories"),
    @("GET stocks", "$Base/stocks"),
    @("GET customers", "$Base/customers"),
    @("GET quick-orders", "$Base/quick-orders")
) | ForEach-Object { Test-Endpoint $_[0] "GET" $_[1] $auth }

$results | Format-Table -AutoSize
$failed = @($results | Where-Object { -not $_.OK })
if ($failed.Count -gt 0) {
    Write-Host "FAILED: $($failed.Count) / $($results.Count)"
    exit 1
}
Write-Host "ALL PASSED: $($results.Count) checks"
exit 0
