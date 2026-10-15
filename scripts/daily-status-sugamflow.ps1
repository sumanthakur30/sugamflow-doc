<#
.SYNOPSIS
  Quick health check: Docker, gateway, Eureka, UI port.
#>
$ErrorActionPreference = 'Continue'
# Canonical script. Compose status is read from D:\sugamFlow.
$repoRoot = 'D:\sugamFlow'

function Test-Url($name, $url, $okStatus = @(200)) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 8
        $ok = $okStatus -contains $r.StatusCode
        $color = if ($ok) { 'Green' } else { 'Yellow' }
        Write-Host ("[{0}] {1} -> HTTP {2}" -f $(if ($ok) { 'OK' } else { '??' }), $name, $r.StatusCode) -ForegroundColor $color
    } catch {
        $code = $null
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        $msg = if ($code) { "HTTP $code" } else { $_.Exception.Message }
        Write-Host ("[FAIL] {0} -> {1}" -f $name, $msg) -ForegroundColor Red
    }
}

Write-Host '== SugamFlow status ==' -ForegroundColor Cyan

try {
    docker info 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host '[OK] Docker engine' -ForegroundColor Green
    } else {
        Write-Host '[FAIL] Docker engine not running' -ForegroundColor Red
    }
} catch {
    Write-Host '[FAIL] Docker CLI not available' -ForegroundColor Red
}

Push-Location $repoRoot
try {
    if (Test-Path '.env.local') {
        Write-Host ''
        docker compose --env-file .env.local ps
    }
} finally {
    Pop-Location
}

Write-Host ''
Test-Url 'Gateway health' 'http://localhost:9090/actuator/health'
Test-Url 'Eureka' 'http://localhost:8761/actuator/health'
Test-Url 'Angular UI' 'http://localhost:4200/' @(200, 304)
Test-Url 'Shops page (SPA)' 'http://localhost:4200/shops' @(200, 304)

Write-Host ''
Write-Host 'Docs: D:\sugamflow-doc\docs\DOCKER-D-DRIVE-SETUP.md' -ForegroundColor DarkGray
