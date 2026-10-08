<#
.SYNOPSIS
  Sequence 01b - optional retail extras (GST, ledger, field force).

.DESCRIPTION
  Requires SEQ 00 (common). Run after SEQ 01 only when you are testing these features:
    gst-mock-service   :8099
    gst-service        :8091   GST returns / e-invoice (/api/v1/gst)
    ledger-service     :8094   Trade GL, CoA, vouchers (/api/v1/ledger)
    fieldforce-service :8090   Promoters, territories, commissions

  Order billing works without them: order-service falls back to its local GST calculator
  and skips ledger vouchers when these are down.

  -Stop stops them again to free about 1.5 GB of RAM.

.EXAMPLE
  .\scripts\sequences\01-sugamflow-retail.ps1
  .\scripts\sequences\01b-retail-extras.ps1
  .\scripts\sequences\01b-retail-extras.ps1 -Only gst-service,gst-mock-service
  .\scripts\sequences\01b-retail-extras.ps1 -Stop
#>
param(
    [ValidateSet('gst-mock-service', 'gst-service', 'ledger-service', 'fieldforce-service')]
    [string[]]$Only,
    [switch]$Stop,
    [int]$HealthTimeoutSec = 240
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

$portMap = [ordered]@{
    'gst-mock-service'   = 8099
    'gst-service'        = 8091
    'ledger-service'     = 8094
    'fieldforce-service' = 8090
}
$services = if ($Only) { @($portMap.Keys | Where-Object { $_ -in $Only }) } else { @($portMap.Keys) }

Write-Host '========================================' -ForegroundColor Cyan
Write-Host ' SEQ 01b - RETAIL EXTRAS (GST / LEDGER / FIELD FORCE)' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan

if ($Stop) {
    # stock-service and gst-service depend on gst-mock; leave it up while stock-service runs.
    if (-not $Only -and (docker ps -q --filter 'label=com.docker.compose.service=stock-service' --filter 'status=running')) {
        $services = @($services | Where-Object { $_ -ne 'gst-mock-service' })
        Write-Host 'Keeping gst-mock-service (stock-service depends on it).' -ForegroundColor DarkGray
    }
    Write-Host ("Stopping: " + ($services -join ', ')) -ForegroundColor Yellow
    $code = Invoke-SugamCompose -RepoRoot $repoRoot -ComposeCmdArgs (@('stop') + $services)
    if ($code -ne 0) { throw 'compose stop failed for retail extras' }
    exit 0
}

# Do not recycle Docker here: SEQ 00/01 already started it, and a recycle kills every running container.
if (-not (Test-PortOpen 9090)) {
    Ensure-SugamLoginStack -RepoRoot $repoRoot -HealthTimeoutSec 120 -SkipMailHog
}

Write-Host ("Starting: " + ($services -join ', ')) -ForegroundColor Green
$buildCode = Ensure-LocalServiceImages -RepoRoot $repoRoot -ServiceNames $services
if ($buildCode -ne 0) { throw 'local build failed for retail extras' }
$code = Invoke-SugamCompose -RepoRoot $repoRoot -ComposeCmdArgs (@('up', '-d', '--no-build') + $services)
if ($code -ne 0) { throw 'compose failed for retail extras' }

$deadline = (Get-Date).AddSeconds($HealthTimeoutSec)
foreach ($s in $services) {
    $p = $portMap[$s]
    while (-not (Test-PortOpen $p) -and (Get-Date) -lt $deadline) { Start-Sleep -Seconds 3 }
    if (Test-PortOpen $p) {
        Write-Host ("  UP  {0,-20} :{1}" -f $s, $p) -ForegroundColor Green
    } else {
        Write-Warning ("  WAIT {0} :{1} (still booting?)" -f $s, $p)
    }
}

Write-Host ''
Write-Host 'Stop them again to free RAM: .\scripts\sequences\01b-retail-extras.ps1 -Stop' -ForegroundColor DarkGray
exit 0
