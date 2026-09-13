# SSH MySQL tunnel: VPS 3306 -> localhost 3306
$ErrorActionPreference = "Stop"
$VpsHost = if ($env:VPS_HOST) { $env:VPS_HOST } else { "76.13.136.137" }
$VpsUser = if ($env:VPS_USER) { $env:VPS_USER } else { "root" }
$Key = if ($env:VPS_KEY) { $env:VPS_KEY } else { "$HOME\.ssh\smartcafe_vps" }
$LocalPort = 3306

function Test-MySqlPort {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $ar = $client.BeginConnect("127.0.0.1", $LocalPort, $null, $null)
        if (-not $ar.AsyncWaitHandle.WaitOne(800)) { return $false }
        $client.EndConnect($ar)
        return $client.Connected
    } catch { return $false }
    finally { try { $client.Close() } catch { } }
}

if (Test-MySqlPort) {
    Write-Host "[OK] MySQL tunnel already open on 127.0.0.1:$LocalPort"
    exit 0
}

$sshArgs = @(
    "-o", "StrictHostKeyChecking=accept-new",
    "-o", "ServerAliveInterval=30",
    "-N",
    "-L", "${LocalPort}:127.0.0.1:3306",
    "${VpsUser}@${VpsHost}"
)

if (Test-Path $Key) {
    $sshArgs = @("-i", $Key) + $sshArgs
    Write-Host "Starting SSH tunnel (key: $Key)..."
} else {
    Write-Host "[!] SSH key not found: $Key"
    exit 1
}

Start-Process -FilePath "ssh" -ArgumentList $sshArgs -WindowStyle Normal

$max = 45
for ($i = 0; $i -lt $max; $i++) {
    Start-Sleep -Seconds 1
    if (Test-MySqlPort) {
        Write-Host "[OK] MySQL tunnel ready (~${i}s)"
        exit 0
    }
}

Write-Host "[X] Tunnel failed - port $LocalPort still closed"
exit 1
