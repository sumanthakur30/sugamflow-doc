# Start IPD + accommodation in Docker (profile ipd) and point the local gateway at them.
# Stops host Maven listeners on :8100 / :8101 first so the containers can bind.
#
#   .\scripts\start-local-ipd.ps1
#   .\scripts\stop-local-ipd.ps1
$ErrorActionPreference = "Stop"
# Canonical script. Compose and the IPD overlay stay in D:\sugamFlow.
$SugamFlowRoot = 'D:\sugamFlow'
Set-Location $SugamFlowRoot

$env:COMPOSE_ENV_FILES = ".env.local"
$overlay = Join-Path $SugamFlowRoot 'ipd-service\deploy\docker-compose.ipd.yml'
if (-not (Test-Path $overlay)) { $overlay = Join-Path $SugamFlowRoot 'docker-compose.ipd.yml' }
$compose = @(
    "compose",
    "-f", "docker-compose.yml",
    "-f", $overlay
)

function Stop-HostPort {
    param([int]$Port)
    $pids = @()
    try {
        $pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique
    } catch {
        $pids = @()
    }
    foreach ($procId in $pids) {
        if (-not $procId -or $procId -eq 0) { continue }
        $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if (-not $p) { continue }
        Write-Host "Stopping host listener on :$Port ($($p.ProcessName) pid $procId)" -ForegroundColor Yellow
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "== Local IPD Compose ==" -ForegroundColor Green
Stop-HostPort -Port 8100
Stop-HostPort -Port 8101
Start-Sleep -Seconds 2

Write-Host "Pulling IPD images..." -ForegroundColor Cyan
& docker @compose --profile ipd pull accommodation-service ipd-service
if ($LASTEXITCODE -ne 0) {
    throw "Image pull failed. Need sumanthakur30/ipd-service:1.0.2 and accommodation-service:1.0.2 (or set IPD_IMAGE_TAG / ACCOMMODATION_IMAGE_TAG)."
}

Write-Host "Starting accommodation-service + ipd-service..." -ForegroundColor Cyan
& docker @compose --profile ipd up -d accommodation-service ipd-service
if ($LASTEXITCODE -ne 0) {
    throw "compose up ipd failed"
}

Write-Host "Recreating gateway with Compose IPD URIs..." -ForegroundColor Cyan
& docker @compose up -d --no-deps --force-recreate gateway-service
if ($LASTEXITCODE -ne 0) {
    throw "gateway recreate failed"
}

Write-Host "Waiting for health..." -ForegroundColor Cyan
$ok = $false
for ($i = 0; $i -lt 36; $i++) {
    try {
        $ipd = Invoke-RestMethod -Uri "http://127.0.0.1:8100/actuator/health" -TimeoutSec 3
        $acc = Invoke-RestMethod -Uri "http://127.0.0.1:8101/actuator/health" -TimeoutSec 3
        if ($ipd.status -eq "UP" -and $acc.status -eq "UP") {
            $ok = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 5
    }
}

& docker @compose --profile ipd ps accommodation-service ipd-service gateway-service
if (-not $ok) {
    Write-Host "Health not UP yet. Check: docker logs sumanthakur30-ipd-service-1" -ForegroundColor Yellow
    exit 1
}
Write-Host "IPD UP on :8100, accommodation UP on :8101, gateway -> ipd-service / accommodation-service" -ForegroundColor Green
