<#
.SYNOPSIS
  Sequence 01 — SugamFlow Retail / shop stack (A3 core, no polyclinic).

.DESCRIPTION
  Requires SEQ 00 (common platform / gateway :9090).

  Starts: product, stock, order, payment, reporting, account

  Does NOT start gst, gst-mock, ledger, fieldforce (use SEQ 01b, or -WithExtras).
  Does NOT start doctor / appointment / queue (use SEQ 02).

.EXAMPLE
  .\scripts\sequences\00-common-platform.ps1
  .\scripts\sequences\01-sugamflow-retail.ps1
  .\scripts\sequences\01-sugamflow-retail.ps1 -WithUi
  .\scripts\sequences\01-sugamflow-retail.ps1 -WithExtras   # old full set, same as running 01b after
#>
param(
    [switch]$WithUi,
    # Also start gst, gst-mock, ledger, fieldforce (-SkipLedger / -SkipGstMock only apply with this)
    [switch]$WithExtras,
    [switch]$SkipLedger,
    [switch]$SkipGstMock,
    [switch]$SkipDockerStart,
    [int]$HealthTimeoutSec = 180
)

$ErrorActionPreference = 'Stop'
$script = Join-Path (Split-Path $PSScriptRoot -Parent) 'start-sugamflow-app.ps1'
if (-not (Test-Path -LiteralPath $script)) {
    throw "Missing $script"
}

Write-Host '========================================' -ForegroundColor Cyan
Write-Host ' SEQ 01 - SUGAMFLOW RETAIL / SHOP (A3)' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $repoRoot 'compose-local.ps1'))) { $repoRoot = 'D:\sugamFlow' }
. (Join-Path $repoRoot 'scripts\repo-powershell.ps1')
Ensure-SugamLoginStack -RepoRoot $repoRoot -HealthTimeoutSec ([Math]::Min(120, $HealthTimeoutSec)) -SkipMailHog

$args = @(
    '-File', $script,
    '-SkipPolyclinic',
    '-HealthTimeoutSec', "$HealthTimeoutSec"
)
if (-not $WithExtras) { $args += '-SkipRetailExtras' }
if ($WithUi) { $args += '-WithUi' }
if ($SkipLedger) { $args += '-SkipLedger' }
if ($SkipGstMock) { $args += '-SkipGstMock' }
if ($SkipDockerStart) { $args += '-SkipDockerStart' }

& powershell -NoProfile -ExecutionPolicy Bypass @args
$code = $LASTEXITCODE
if ($code -ne 0) { exit $code }

# Re-check after A3 up — Docker churn can stop gateway/shop.
Ensure-SugamLoginStack -RepoRoot $repoRoot -HealthTimeoutSec 90 -SkipMailHog

Write-Host ''
Write-Host 'UI: http://localhost:4200  (shop-management-ui)' -ForegroundColor Green
Write-Host 'Demo: ShopId=RET-DEMO-01 User=demo Password=Demo@2026' -ForegroundColor DarkGray
exit 0
