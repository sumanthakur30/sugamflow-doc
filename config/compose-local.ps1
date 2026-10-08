#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Run Docker Compose with local variable interpolation from `.env.local`.

.DESCRIPTION
  Compose only auto-loads `.env`. Setting COMPOSE_ENV_FILES makes `${VAR}` substitution
  use `.env.local` (later files override earlier ones in the chain).

  Interactive (Windows PowerShell — required so -d is not a script switch):
    .\compose-local.ps1 --% up -d --no-build doctor-service appointment-service queue-management-service
    .\compose-local.ps1 -UpStack
    .\compose-local.ps1 -UpStack -Clean

  From other scripts — prefer the shared helper (never pass a hashtable literal):
    . .\scripts\repo-powershell.ps1
    Invoke-SugamCompose -RepoRoot $repoRoot -ComposeCmdArgs @('up','-d','--no-build','doctor-service')

  If you must call this script from another script, splat a VARIABLE (not @{...} inline):
    $p = @{ ComposeArgs = [string[]]@('up','-d','--no-build','doctor-service') }
    & .\compose-local.ps1 @p
#>
param(
    [switch]$UpStack,
    [switch]$Clean,
    [string[]]$ComposeArgs
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Support: .\compose-local.ps1 --% up -d --no-build doctor-service
# Also recover if a caller wrongly passed an inline hashtable as a positional arg.
if (($null -eq $ComposeArgs -or $ComposeArgs.Count -eq 0) -and $args.Count -gt 0) {
    if ($args.Count -eq 1 -and $args[0] -is [System.Collections.IDictionary]) {
        $ht = $args[0]
        if ($ht.Contains('ComposeArgs')) {
            Write-Warning 'Received hashtable positionally. Use: $p=@{ComposeArgs=...}; & .\compose-local.ps1 @p — or Invoke-SugamCompose.'
            $ComposeArgs = [string[]]@($ht['ComposeArgs'])
        } else {
            throw "Invalid compose-local call: got Hashtable without ComposeArgs. Use Invoke-SugamCompose or splat a variable: `$p=@{ComposeArgs=@('up','-d',...)}; & .\compose-local.ps1 @p"
        }
    } else {
        $ComposeArgs = [string[]]@($args)
    }
}

# Guard: never let a stringified Hashtable reach docker.
if ($ComposeArgs -and ($ComposeArgs -join ' ') -match 'System\.Collections\.Hashtable') {
    throw "ComposeArgs looks corrupted (Hashtable). Use Invoke-SugamCompose -ComposeCmdArgs @('up','-d',...)."
}

$Script:LocalInfraServices = @(
    "redis",
    "mailhog",
    "config-service",
    "discovery-service"
)

$Script:LocalAppServices = @(
    "shop-service",
    "product-service",
    "stock-service",
    "order-service",
    "user-service",
    "auth-service",
    "payment-service",
    "notification-service",
    "reporting-service",
    "account-service",
    "fieldforce-service",
    "gst-service",
    "gst-mock-service",
    "doctor-service",
    "appointment-service",
    "queue-management-service",
    "gateway-service"
)

$Script:PolyclinicServices = @(
    "doctor-service",
    "appointment-service",
    "queue-management-service"
)

$localEnv = Join-Path $PSScriptRoot ".env.local"
if (-not (Test-Path -LiteralPath $localEnv)) {
    Write-Warning "Missing '.env.local'. Copy '.env.example' to '.env.local' and adjust. Compose defaults from docker-compose.yml may be used."
}

# Load `.env.local` for interpolation (and keep default `.env` when present).
$env:COMPOSE_ENV_FILES = ".env.local"

function Test-DockerImage {
    param([string]$Name)
    & docker image inspect $Name 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
}

function Ensure-CommonLibsImage {
    param([switch]$NoCache)
    if (Test-DockerImage "sugamflow-common-libs:local" -and Test-DockerImage "sugamflow-jre:local" -and -not $NoCache) {
        Write-Host "Using cached sugamflow-common-libs:local and sugamflow-jre:local." -ForegroundColor DarkGray
        return
    }
    $buildArgs = @("build", "-f", "docker/Dockerfile.common-libs", "-t", "sugamflow-common-libs:local", ".")
    if ($NoCache) { $buildArgs += "--no-cache" }
    Write-Host "Building shared Maven libs (platform-common, catalog-common, security-common)..." -ForegroundColor Cyan
    & docker @buildArgs
    if ($LASTEXITCODE -ne 0) {
        $existing = docker image inspect sugamflow-common-libs:local 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "common-libs build failed. Fix errors above before building servlet services." -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Write-Host "Using existing sugamflow-common-libs:local." -ForegroundColor Yellow
    }
    Write-Host "Building local JRE runtime (sugamflow-jre:local)..." -ForegroundColor Cyan
    & docker build -f docker/Dockerfile.jre-local -t sugamflow-jre:local .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "sugamflow-jre:local build failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

function Invoke-ComposeLocal {
    # Pass the array as ONE named param — never splat into this function
    # (flags like -d / --services get mis-parsed as PowerShell parameters).
    param([Parameter(Mandatory = $true)][string[]]$ComposeCmdArgs)
    # Docker Compose writes progress to stderr; do not treat as terminating under Stop.
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & docker compose @ComposeCmdArgs
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prevEap
    if ($code -ne 0) {
        # return (not exit) so callers can retry on Conflict without killing the session
        return $code
    }
}

if ($UpStack) {
    Write-Host "== SugamFlow local Docker startup (compose-local) ==" -ForegroundColor Green
    Write-Host "Using COMPOSE_ENV_FILES=$($env:COMPOSE_ENV_FILES)" -ForegroundColor Yellow

    if ($Clean) {
        Write-Host "Stopping existing stack..." -ForegroundColor Yellow
        Invoke-ComposeLocal -ComposeCmdArgs @("down")
    }

    Write-Host "Starting infra services..." -ForegroundColor Cyan
    Invoke-ComposeLocal -ComposeCmdArgs (@("up", "-d", "--no-build") + $Script:LocalInfraServices)

    Write-Host "Starting application services (incl. polyclinic)..." -ForegroundColor Cyan
    Invoke-ComposeLocal -ComposeCmdArgs (@("up", "-d", "--no-build") + $Script:LocalAppServices)

    Write-Host ""
    Write-Host "All services requested. Current status:" -ForegroundColor Green
    Invoke-ComposeLocal -ComposeCmdArgs @("ps")

    Write-Host ""
    Write-Host "Health check: http://localhost:9090/actuator/health" -ForegroundColor Yellow
    Write-Host "If Hub pulls fail with CloudFront EOF: .\scripts\pull-stack-images.ps1 then re-run -UpStack" -ForegroundColor DarkGray
    Write-Host "Polyclinic DB bootstrap: infra\postgres\run-fix-polyclinic-as-postgres.bat" -ForegroundColor DarkGray
    exit 0
}

if ($null -eq $ComposeArgs -or $ComposeArgs.Count -eq 0) {
    Write-Host "Pass compose arguments or use -UpStack for full local stack." -ForegroundColor Yellow
    Write-Host "  .\compose-local.ps1 -UpStack" -ForegroundColor DarkGray
    Write-Host "  .\compose-local.ps1 --% up -d --no-build $($Script:PolyclinicServices -join ' ')" -ForegroundColor DarkGray
    Write-Host "  IPD containers (not Maven): .\scripts\start-local-ipd.ps1" -ForegroundColor DarkGray
    Write-Host "  From scripts: Invoke-SugamCompose -RepoRoot `$pwd -ComposeCmdArgs @('up','-d',...)" -ForegroundColor DarkGray
    exit 1
}

# Any `compose build` must use a current sugamflow-common-libs:local (see docker/Dockerfile.common-libs).
if ($ComposeArgs[0] -eq "build") {
    Ensure-CommonLibsImage
    if (-not $env:COMPOSE_PARALLEL_LIMIT) {
        $env:COMPOSE_PARALLEL_LIMIT = "2"
        Write-Host "COMPOSE_PARALLEL_LIMIT=2 (set to 1 if Docker runs out of memory during Maven builds)." -ForegroundColor DarkGray
    }
}

# Named param keeps the array intact; splat only at the docker CLI boundary above.
Invoke-ComposeLocal -ComposeCmdArgs $ComposeArgs
