<#
.SYNOPSIS
  Sequence 03 — School ERP domain services + UI.

.DESCRIPTION
  Requires SEQ 00 with Eureka published for school jars:
    .\scripts\sequences\00-common-platform.ps1 -ExposeSchoolPorts

  Then starts school microservices :8181–:8199 and optionally school-ui :4300.

.EXAMPLE
  .\scripts\sequences\00-common-platform.ps1 -ExposeSchoolPorts -SkipMailHog
  .\scripts\sequences\03-school-erp.ps1
  .\scripts\sequences\03-school-erp.ps1 -WithUi -Restart
#>
param(
    [string]$SchoolRoot = 'D:\school',
    [string]$SugamFlowRoot = 'D:\sugamFlow',
    [switch]$Restart,
    [switch]$WithUi,
    [switch]$SkipSeed
)

$ErrorActionPreference = 'Stop'

Write-Host '========================================' -ForegroundColor Cyan
Write-Host ' SEQ 03 — SCHOOL ERP' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $SchoolRoot)) {
    throw "School repo not found: $SchoolRoot"
}

# Prefer school start-platform if jars mode is used; otherwise assume SEQ 00 docker common is up.
$gwOk = $false
try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:9090/actuator/health' -UseBasicParsing -TimeoutSec 3
    $gwOk = $r.StatusCode -ge 200
} catch { }
$eurekaOk = $false
try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8761/actuator/health' -UseBasicParsing -TimeoutSec 3
    $eurekaOk = $r.StatusCode -ge 200
} catch { }

if (-not $gwOk -or -not $eurekaOk) {
    Write-Host 'Common gateway/Eureka not healthy. Starting school platform jars helper...' -ForegroundColor Yellow
    $plat = Join-Path $SchoolRoot 'scripts\start-platform.ps1'
    if (Test-Path $plat) {
        & powershell -NoProfile -ExecutionPolicy Bypass -File $plat -SugamFlowRoot $SugamFlowRoot -SkipMailHog
        if ($LASTEXITCODE -ne 0) { throw 'start-platform.ps1 failed' }
    } else {
        throw 'Run SEQ 00 first: .\scripts\sequences\00-common-platform.ps1 -ExposeSchoolPorts'
    }
}

if (-not $SkipSeed) {
    $seed = Join-Path $SchoolRoot 'scripts\seed-school-demo-auth.ps1'
    if (Test-Path $seed) {
        Write-Host 'Seeding school demo auth (safe to re-run)...' -ForegroundColor DarkGray
        & powershell -NoProfile -ExecutionPolicy Bypass -File $seed
    }
}

$svc = Join-Path $SchoolRoot 'scripts\start-services.ps1'
if (-not (Test-Path $svc)) { throw "Missing $svc" }
$svcArgs = @('-File', $svc)
if ($Restart) { $svcArgs += '-Restart' }
# SEQ 00 common platform runs gateway in Docker — school jars must advertise host.docker.internal
# or Eureka returns 127.0.0.1 and gateway gets Connection refused on :818x.
$dockerGw = $false
try {
  $dockerGw = [bool](& docker ps --format '{{.Names}}' 2>$null | Where-Object { $_ -match 'gateway-service' })
} catch { }
if ($dockerGw) {
  $svcArgs += @('-AdvertiseIp', 'host.docker.internal')
  Write-Host 'Docker gateway detected — school Eureka advertise = host.docker.internal' -ForegroundColor Yellow
}
& powershell -NoProfile -ExecutionPolicy Bypass @svcArgs
if ($LASTEXITCODE -ne 0) { throw 'start-services.ps1 failed' }

if ($WithUi) {
    $ui = Join-Path $SchoolRoot 'apps\school-ui'
    Write-Host 'Starting school-ui on :4300 (new window)...' -ForegroundColor Cyan
    Start-Process cmd.exe -ArgumentList '/k', "cd /d `"$ui`" && npx ng serve --port 4300"
}

Write-Host ''
Write-Host 'School UI: http://localhost:4300' -ForegroundColor Green
Write-Host 'Gateway:   http://localhost:9090' -ForegroundColor Green
Write-Host 'See: D:\school\docs\DAILY_START.md' -ForegroundColor DarkGray
exit 0
