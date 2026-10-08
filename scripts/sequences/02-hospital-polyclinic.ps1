<#
.SYNOPSIS
  Sequence 02 — Hospital / Polyclinic services (doctor, appointment, queue).

.DESCRIPTION
  Requires SEQ 00 (common). Prefer SEQ 01 first if you also need retail POS/stock.

  Starts only:
    doctor-service :8092
    appointment-service :8093
    queue-management-service :8098

.EXAMPLE
  .\scripts\sequences\00-common-platform.ps1
  .\scripts\sequences\01-sugamflow-retail.ps1   # optional but usual
  .\scripts\sequences\02-hospital-polyclinic.ps1
#>
param(
    [switch]$SkipDockerStart,
    [switch]$WithUi,
    [int]$HealthTimeoutSec = 180
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $repoRoot 'compose-local.ps1'))) {
    $repoRoot = 'D:\sugamFlow'
}
Set-Location $repoRoot

. (Join-Path $repoRoot 'scripts\repo-powershell.ps1')
Initialize-DockerCliPath

function Test-PortOpen([int]$Port) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $ok = $c.ConnectAsync('127.0.0.1', $Port).Wait(600)
        if ($ok -and $c.Connected) { $c.Close(); return $true }
        $c.Close()
        return $false
    } catch { return $false }
}

function Wait-Http([string]$Url, [int]$Seconds) {
    for ($i = 1; $i -le $Seconds; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { return $true }
        } catch { }
        Start-Sleep -Seconds 1
    }
    return $false
}

Write-Host '========================================' -ForegroundColor Cyan
Write-Host ' SEQ 02 - HOSPITAL / POLYCLINIC' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan

if (-not $SkipDockerStart) {
    & (Join-Path $repoRoot 'scripts\start-docker-clean.ps1')
    if ($LASTEXITCODE -ne 0) { throw 'Docker not ready' }
}

# Always re-assert login stack: SEQ 02 alone used to leave gateway/shop down → UI 504.
Ensure-SugamLoginStack -RepoRoot $repoRoot -HealthTimeoutSec $HealthTimeoutSec -SkipMailHog

# Retail containers have no restart policy, so a Docker restart leaves them stopped (clinic medicine search then 500s).
# Bring back only the core ones SEQ 01 already created; never create retail services here.
# Extras (gst, ledger, fieldforce) are left to 01b-retail-extras.ps1 so a deliberate -Stop stays stopped.
$retailServices = @(
    'product-service', 'stock-service', 'order-service', 'payment-service', 'reporting-service', 'account-service'
)
$stoppedRetail = @($retailServices | Where-Object {
    docker ps -a -q --filter "label=com.docker.compose.service=$_" --filter 'status=exited' --filter 'status=created'
})
if ($stoppedRetail.Count -gt 0) {
    Write-Host ("Restarting stopped retail services: " + ($stoppedRetail -join ', ')) -ForegroundColor Yellow
    $retailCode = Invoke-SugamCompose -RepoRoot $repoRoot -ComposeCmdArgs (@('up', '-d', '--no-build') + $stoppedRetail)
    if ($retailCode -ne 0) { Write-Warning 'Could not restart stopped retail services - run .\scripts\sequences\01-sugamflow-retail.ps1' }
}

$services = @(
    'doctor-service',
    'appointment-service',
    'queue-management-service'
)

Write-Host ("Starting: " + ($services -join ', ')) -ForegroundColor Green
# These services use pull_policy: build. A missing image must be built here.
# docker pull of sumanthakur30/* hits CloudFront EOF and does not satisfy pull_policy: build.
$buildCode = Ensure-LocalServiceImages -RepoRoot $repoRoot -ServiceNames $services
if ($buildCode -ne 0) { throw 'local build failed for polyclinic services' }
$composeArgs = @('up', '-d', '--no-build') + $services
# Invoke-SugamCompose calls docker compose directly (Windows PowerShell-safe).
# Do NOT use: & .\compose-local.ps1 @{ ComposeArgs = ... }  — that passes a Hashtable.
$code = Invoke-SugamCompose -RepoRoot $repoRoot -ComposeCmdArgs $composeArgs
if ($code -ne 0) { throw 'compose failed for polyclinic services' }

$portMap = @{
    'doctor-service'           = 8092
    'appointment-service'      = 8093
    'queue-management-service' = 8098
}

$deadline = (Get-Date).AddSeconds($HealthTimeoutSec)
foreach ($s in $services) {
    $p = $portMap[$s]
    while (-not (Test-PortOpen $p) -and (Get-Date) -lt $deadline) { Start-Sleep -Seconds 2 }
    if (Test-PortOpen $p) {
        Write-Host ("  UP  {0,-28} :{1}" -f $s, $p) -ForegroundColor Green
    } else {
        Write-Warning ("  WAIT {0} :{1} (still booting?)" -f $s, $p)
    }
}

if ($WithUi) {
    $uiCmd = "cd /d `"$repoRoot\shop-management-ui`" && npx ng serve --port 4200"
    Start-Process cmd.exe -ArgumentList '/k', $uiCmd
}

Write-Host ''
Write-Host 'Polyclinic demo: ShopId=TRUST-POLY-01 or POLY-DEMO-01 User=demo Password=Demo@2026' -ForegroundColor DarkGray
Write-Host 'UI: http://localhost:4200  (needs gateway :9090 - run .\scripts\ensure-login-stack.ps1 if 504)' -ForegroundColor Green
exit 0
