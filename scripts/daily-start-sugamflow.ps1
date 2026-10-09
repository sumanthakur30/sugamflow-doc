<#
.SYNOPSIS
  Daily SugamFlow startup: Docker Desktop -> backend stack -> optional Angular UI.

.EXAMPLE
  .\scripts\daily-start-sugamflow.ps1
  .\scripts\daily-start-sugamflow.ps1 -WithUi
  .\scripts\daily-start-sugamflow.ps1 -SkipDockerStart
#>
param(
    [switch]$WithUi,
    [switch]$SkipDockerStart,
    [switch]$SkipMail
)

$ErrorActionPreference = 'Stop'
# Canonical script. Compose, start-local.ps1, and repo-powershell.ps1 stay in D:\sugamFlow.
$SugamFlowRoot = 'D:\sugamFlow'
Set-Location $SugamFlowRoot

. (Join-Path $SugamFlowRoot 'scripts\repo-powershell.ps1')

Write-Host '== SugamFlow daily start ==' -ForegroundColor Green
Write-Host "Repo: $SugamFlowRoot" -ForegroundColor DarkGray

if (-not $SkipDockerStart) {
    Invoke-RepoPowerShell -ScriptArgs @('-File', (Join-Path $PSScriptRoot 'start-docker-clean.ps1'))
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker is not ready. Install/start Docker Desktop (disk image: D:\Docker). See D:\sugamflow-doc\docs\DOCKER-D-DRIVE-SETUP.md'
    }
}

$startArgs = @('-File', (Join-Path $SugamFlowRoot 'start-local.ps1'))
if ($SkipMail) { $startArgs += '-SkipMail' }
Invoke-RepoPowerShell -ScriptArgs $startArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Backend ready (may take 2-5 min for all JVM services on first boot).' -ForegroundColor Yellow
Write-Host '  Gateway health: http://localhost:9090/actuator/health' -ForegroundColor Cyan
Write-Host '  Eureka:         http://localhost:8761' -ForegroundColor DarkGray

if ($WithUi) {
    Write-Host ''
    Write-Host 'Starting Angular UI on port 4200 (new window)...' -ForegroundColor Cyan
    $uiCmd = "cd /d `"$SugamFlowRoot\shop-management-ui`" && npx ng serve --port 4200"
    Start-Process cmd.exe -ArgumentList '/k', $uiCmd
    Write-Host '  UI: http://localhost:4200' -ForegroundColor Cyan
} else {
    Write-Host ''
    Write-Host 'Start UI manually:' -ForegroundColor DarkGray
    Write-Host "  cd $SugamFlowRoot\shop-management-ui" -ForegroundColor White
    Write-Host '  npx ng serve --port 4200' -ForegroundColor White
}
