# Fast check: 127.0.0.1:3306 (SSH MySQL tunnel)
function Test-MySqlPort {
    param([int]$timeoutMs = 800)
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $ar = $client.BeginConnect([string]'127.0.0.1', 3306, $null, $null)
        if (-not $ar.AsyncWaitHandle.WaitOne($timeoutMs)) { return $false }
        $client.EndConnect($ar)
        return $client.Connected
    }
    catch { return $false }
    finally {
        try { $client.Close() } catch { }
    }
}

$maxAttempts = 90
$intervalSec = 1

for ($i = 0; $i -lt $maxAttempts; $i++) {
    if (Test-MySqlPort) {
        Write-Host "[OK] MySQL tunnel 127.0.0.1:3306 (waited ~$i s)"
        exit 0
    }
    if (($i % 5) -eq 0) { Write-Host "  ... waiting for 3306 ($i/$maxAttempts s)" }
    Start-Sleep -Seconds $intervalSec
}

Write-Host "[!] Port 3306 not open - check SSH-MySQL-Tunnel window. API DB calls will fail."
exit 1
