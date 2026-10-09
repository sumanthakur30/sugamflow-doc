#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Build Docker images for Compose with limited parallelism (avoids Docker Desktop OOM on Windows).

.EXAMPLE
  .\build-docker.ps1
  .\build-docker.ps1 -Parallel 1
  .\build-docker.ps1 -Services config-service,order-service,stock-service
#>
param(
    [int]$Parallel = 1,
    [string[]]$Services = @(),
    [int]$MaxAttempts = 2,
    [switch]$RebuildCommonLibs,
    [switch]$UseMcrBase
)

$ErrorActionPreference = "Continue"
# Canonical script. Dockerfiles, compose, and .env.local stay in D:\sugamFlow.
$SugamFlowRoot = 'D:\sugamFlow'
Set-Location $SugamFlowRoot

$env:DOCKER_BUILDKIT = "1"

function Wait-DockerEngine {
    param([int]$TimeoutSec = 180)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        & docker info 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            return
        }
        Write-Host "Waiting for Docker Engine (start Docker Desktop and wait until 'Engine running')..." -ForegroundColor DarkGray
        Start-Sleep -Seconds 5
    }
    Write-Host "Docker Engine not ready after ${TimeoutSec}s." -ForegroundColor Red
    Write-Host "Open Docker Desktop from the Start menu, wait until the whale icon is steady, then run: docker ps" -ForegroundColor Yellow
    exit 1
}

Wait-DockerEngine

function Test-DockerImage {
    param([string]$Name)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    try {
        & docker image inspect $Name 2>$null | Out-Null
        return $LASTEXITCODE -eq 0
    } finally {
        $ErrorActionPreference = $prev
    }
}

function Pull-BaseImage {
    param(
        [string]$Image,
        [int]$MaxAttempts = 5,
        [switch]$Optional
    )
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    try {
        for ($i = 1; $i -le $MaxAttempts; $i++) {
            Write-Host "Pulling $Image (attempt $i/$MaxAttempts)..." -ForegroundColor DarkGray
            & docker pull $Image 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                return $true
            }
            if ($i -lt $MaxAttempts) {
                Start-Sleep -Seconds 25
            }
        }
    } finally {
        $ErrorActionPreference = $prev
    }
    if ($Optional) {
        Write-Host "Optional pull failed for $Image (build may retry the pull)." -ForegroundColor Yellow
        return $false
    }
    Write-Host "Failed to pull $Image (Docker Hub CDN/network). Retry: docker pull $Image" -ForegroundColor Yellow
    exit 1
}

$hasCommonLibs = Test-DockerImage "sugamflow-common-libs:local"
$hasJre = Test-DockerImage "sugamflow-jre:local"
$hasMavenBase = Test-DockerImage "maven:3.9-eclipse-temurin-17"
$hasTemurinJre = Test-DockerImage "eclipse-temurin:17-jre"

$useMcr = $UseMcrBase
if (-not $useMcr -and -not $hasCommonLibs) {
    Write-Host "Checking Docker Hub maven base (skip with -UseMcrBase when CloudFront EOF)..." -ForegroundColor DarkGray
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    & docker pull "maven:3.9-eclipse-temurin-17" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker Hub pull failed - using MCR base (no Hub required)." -ForegroundColor Yellow
        $useMcr = $true
    }
    $ErrorActionPreference = $prev
}

if ($useMcr) {
    if (-not (Test-DockerImage "mcr.microsoft.com/openjdk/jdk:17-ubuntu")) {
        Write-Host "Pulling MCR OpenJDK base (not Docker Hub)..." -ForegroundColor Cyan
        Pull-BaseImage "mcr.microsoft.com/openjdk/jdk:17-ubuntu" -MaxAttempts 10
    }
} elseif ($hasCommonLibs -and $hasJre -and (($hasMavenBase -and $hasTemurinJre) -or -not $RebuildCommonLibs)) {
    # Skip Hub pulls when local bases already exist. -RebuildCommonLibs alone must not
    # block for 15x CloudFront retries if maven/jre tags are already on disk.
    Write-Host "Using local Docker bases (common-libs/jre/maven cache present; skipping Hub pulls)." -ForegroundColor Green
} else {
    Write-Host "Pre-pulling public base images (needed when local cache is missing)..." -ForegroundColor Cyan
    Write-Host "CloudFront EOF is common - retrying maven base up to 15 times (or use -UseMcrBase)..." -ForegroundColor DarkGray
    if (-not $hasMavenBase) {
        Pull-BaseImage "maven:3.9-eclipse-temurin-17" -MaxAttempts 15 -Optional | Out-Null
    } else {
        Write-Host "maven:3.9-eclipse-temurin-17 already local — skip pull." -ForegroundColor DarkGray
    }
    if (-not $hasTemurinJre) {
        Pull-BaseImage "eclipse-temurin:17-jre" -MaxAttempts 10 -Optional | Out-Null
    } else {
        Write-Host "eclipse-temurin:17-jre already local — skip pull." -ForegroundColor DarkGray
    }
}

$requiredPaths = @(
    "platform-common/pom.xml",
    "catalog-common/pom.xml",
    "security-common/pom.xml",
    "docker/Dockerfile.common-libs",
    "docker/maven-docker-settings.xml",
    "docker/mvn-package-retry.sh"
)
foreach ($path in $requiredPaths) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing $path - required for Docker builds (shared Maven libs)."
    }
}

if ($hasCommonLibs -and -not $RebuildCommonLibs) {
    Write-Host "Skipping common-libs rebuild (use -RebuildCommonLibs to force)." -ForegroundColor DarkGray
} else {
    $commonLibsDockerfile = if ($useMcr) { "docker/Dockerfile.common-libs-mcr" } else { "docker/Dockerfile.common-libs" }
    Write-Host "Building shared Maven libs ($commonLibsDockerfile)..." -ForegroundColor Cyan
    & docker build -f $commonLibsDockerfile -t sugamflow-common-libs:local .
    if ($LASTEXITCODE -ne 0) {
        if (Test-DockerImage "sugamflow-common-libs:local") {
            Write-Host "Common libs rebuild failed - keeping existing sugamflow-common-libs:local." -ForegroundColor Yellow
        } else {
            Write-Host "Common libs build failed." -ForegroundColor Red
            if (docker info 2>&1 | Select-String -Pattern "500 Internal Server Error|Cannot connect") {
                Write-Host "Docker Engine is not running. Wait for Docker Desktop to finish starting, then retry." -ForegroundColor Yellow
            } else {
                Write-Host "Retry with: docker build -f docker/Dockerfile.common-libs -t sugamflow-common-libs:local . --no-cache" -ForegroundColor Yellow
            }
            exit $LASTEXITCODE
        }
    }
}

if (Test-DockerImage "sugamflow-jre:local" -and -not $RebuildCommonLibs) {
    Write-Host "Skipping JRE runtime rebuild (use -RebuildCommonLibs to refresh sugamflow-jre:local)." -ForegroundColor DarkGray
} else {
    if (-not (Test-DockerImage "sugamflow-common-libs:local")) {
        Write-Host "Cannot build sugamflow-jre:local - sugamflow-common-libs:local is missing." -ForegroundColor Red
        exit 1
    }
    Write-Host "Building local JRE runtime (sugamflow-jre:local, no Docker Hub pull)..." -ForegroundColor Cyan
    & docker build -f docker/Dockerfile.jre-local -t sugamflow-jre:local .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build sugamflow-jre:local from common-libs." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

if (-not (Test-DockerImage "sugamflow-jre:local")) {
    Write-Host "sugamflow-jre:local is still missing. Run:" -ForegroundColor Red
    Write-Host "  docker build -f docker/Dockerfile.jre-local -t sugamflow-jre:local ." -ForegroundColor White
    exit 1
}

$env:COMPOSE_PARALLEL_LIMIT = [string]$Parallel

$localEnv = Join-Path $SugamFlowRoot ".env.local"
if (Test-Path -LiteralPath $localEnv) {
    $env:COMPOSE_ENV_FILES = ".env.local"
}

Write-Host "Building services with COMPOSE_PARALLEL_LIMIT=$Parallel (use -Parallel 1 if Maven steps fail under load)." -ForegroundColor Cyan
Write-Host "Servlet images use sugamflow-common-libs:local (see docker/Dockerfile.common-libs)." -ForegroundColor DarkGray

$composeArgs = @("compose", "build", "--progress", "plain")
if ($Services.Count -gt 0) {
    $composeArgs += $Services
}

$attempt = 0
do {
    $attempt++
    if ($attempt -gt 1) {
        Write-Host "Retrying compose build (attempt $attempt of $MaxAttempts) after transient Maven/network error..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    }
    & docker @composeArgs
    if ($LASTEXITCODE -eq 0) {
        break
    }
} while ($attempt -lt $MaxAttempts)

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Build failed. Common causes:" -ForegroundColor Yellow
    Write-Host "  - Docker Hub CDN EOF pulling eclipse-temurin:17-jre -> docker pull eclipse-temurin:17-jre then retry"
    Write-Host "  - Maven Central TLS/network (Remote host terminated the handshake) -> retry or use -Parallel 1"
    Write-Host "  - Stale common-libs after platform-common changes -> rebuild common-libs (step 4 below)"
    Write-Host ""
    Write-Host "Try:" -ForegroundColor Yellow
    Write-Host "  1. Restart Docker Desktop"
    Write-Host "  2. Settings -> Resources -> Memory: 8 GB or more"
    Write-Host "  3. .\build-docker.ps1 -Parallel 1"
    Write-Host "  4. Rebuild common libs: docker build -f docker/Dockerfile.common-libs -t sugamflow-common-libs:local . --no-cache"
    Write-Host "  5. Single service: docker compose build product-service --progress plain"
    exit $LASTEXITCODE
}

Write-Host "Build finished." -ForegroundColor Green
