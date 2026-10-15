<#
.SYNOPSIS
  Sequence 00 — Common platform (shared by Retail, Hospital, School, CRM).

.DESCRIPTION
  A1 infrastructure + A2 shared microservices:
    Postgres :5432, Redis :6379
    config, discovery (Eureka), auth, shop, notification, user, gateway :9090
    platform subscription-service :8182 (Super Admin catalog; jar in D:\school)

  Run this FIRST before any application sequence.

.EXAMPLE
  .\scripts\sequences\00-common-platform.ps1
  .\scripts\sequences\00-common-platform.ps1 -ExposeSchoolPorts -SkipMailHog
#>
param(
    [switch]$SkipMailHog,
    [switch]$SkipDockerStart,
    [switch]$ExposeSchoolPorts,
    [int]$HealthTimeoutSec = 180,
    [string]$SchoolRoot = 'D:\school',
    [switch]$SkipSubscription
)

$ErrorActionPreference = 'Stop'
# This sequence lives in D:\sugamflow-doc. Compose and the runtime starter stay in D:\sugamFlow.
$SugamFlowRoot = 'D:\sugamFlow'
$script = Join-Path $SugamFlowRoot 'scripts\start-common-platform.ps1'
if (-not (Test-Path -LiteralPath $script)) {
    throw "Missing $script"
}

Write-Host '========================================' -ForegroundColor Cyan
Write-Host ' SEQ 00 - COMMON PLATFORM (A1 + A2)' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan

$args = @('-File', $script, '-HealthTimeoutSec', "$HealthTimeoutSec")
if ($SkipMailHog) { $args += '-SkipMailHog' }
if ($SkipDockerStart) { $args += '-SkipDockerStart' }
if ($ExposeSchoolPorts) { $args += '-ExposeSchoolPorts' }
if ($SkipSubscription) { $args += '-SkipSubscription' }
$args += @('-SchoolRoot', $SchoolRoot)

& powershell -NoProfile -ExecutionPolicy Bypass @args
$code = $LASTEXITCODE
if ($code -ne 0) { exit $code }

Write-Host ''
Write-Host 'NEXT:' -ForegroundColor Yellow
Write-Host '  Retail / shop:     D:\sugamflow-doc\scripts\sequences\01-sugamflow-retail.ps1'
Write-Host '  Hospital/clinic:   D:\sugamflow-doc\scripts\sequences\02-hospital-polyclinic.ps1'
Write-Host '  School ERP:        D:\sugamflow-doc\scripts\sequences\03-school-erp.ps1'
Write-Host '  CRM:               D:\sugamflow-doc\scripts\sequences\04-crm.ps1'
exit 0
