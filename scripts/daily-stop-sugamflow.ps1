<#
.SYNOPSIS
  Stop SugamFlow Docker stack (keeps Docker Desktop running).
#>
$ErrorActionPreference = 'Stop'
# Canonical script. Compose files and .env.local stay in D:\sugamFlow.
$repoRoot = 'D:\sugamFlow'
$envFile = Join-Path $repoRoot '.env.local'
if (-not (Test-Path -LiteralPath $envFile)) { $envFile = '.env.local' }

Push-Location $repoRoot
try {
    Write-Host '== Stopping SugamFlow stack ==' -ForegroundColor Yellow
    docker compose --env-file $envFile down
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host 'Stack stopped.' -ForegroundColor Green
} finally {
    Pop-Location
}
