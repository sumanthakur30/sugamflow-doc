<#
.SYNOPSIS
  Ensure shop + auth + gateway are healthy (fixes UI 504 on /api/v1/auth/login).

.DESCRIPTION
  shop-management-ui (:4200) proxies API calls to gateway :9090.
  If gateway or shop was stopped (Docker restart, partial SEQ), login shows 504.

.EXAMPLE
  cd D:\sugamFlow
  .\scripts\ensure-login-stack.ps1
#>
param(
    [string]$RepoRoot = 'D:\sugamFlow',
    [int]$HealthTimeoutSec = 180,
    [switch]$SkipMailHog
)

$ErrorActionPreference = 'Stop'
# Canonical script. Do not treat this file's folder as the compose repo.
$helper = Join-Path $RepoRoot 'scripts\repo-powershell.ps1'
if (-not (Test-Path -LiteralPath $helper)) {
    throw "Missing $helper"
}
Set-Location $RepoRoot
. $helper

Ensure-SugamLoginStack -RepoRoot $RepoRoot -HealthTimeoutSec $HealthTimeoutSec -SkipMailHog:$SkipMailHog
Write-Host ''
Write-Host 'Retry login: http://localhost:4200' -ForegroundColor Yellow
Write-Host 'Demo: ShopId=TRUST-POLY-01 or POLY-DEMO-01  User=demo  Password=Demo@2026' -ForegroundColor DarkGray
exit 0
