# Start Docker Desktop cleanly and wait until the engine is ready.
# Usage:
#   powershell -ExecutionPolicy Bypass -File D:\sugamflow-doc\scripts\start-docker-clean.ps1
# If Desktop is already open but docker info never answers, this script quits it once and starts fresh.
# Pass -NoRecycle to wait only (repair-docker.ps1 already stopped WSL).
# If WSL times out, run repair-wsl.ps1 as Administrator first.
# If engine still fails with MountDisk/ACCESS_DENIED, run reset-docker-engine.ps1 as Administrator.
param(
    [int]$TimeoutSeconds = 300,
    [switch]$NoRecycle
)

$ErrorActionPreference = 'Continue'
$dockerExeCandidates = @(
    "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe",
    'D:\Docker\Docker\Docker Desktop.exe'
)
$dockerExe = $dockerExeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $dockerExe) {
    throw "Docker Desktop not found. Expected one of: $($dockerExeCandidates -join ', ')"
}

$dockerCliCandidates = @(
    (Get-Command docker -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source),
    "${env:ProgramFiles}\Docker\Docker\resources\bin\docker.exe",
    'D:\Docker\Docker\resources\bin\docker.exe'
)
$script:DockerCli = $dockerCliCandidates | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
if (-not $script:DockerCli) {
    $script:DockerCli = 'docker'
}

function Invoke-WslText {
    param(
        [string[]]$Args,
        [int]$TimeoutSec = 20
    )
    $job = Start-Job {
        param($wslArgs)
        $prev = $OutputEncoding
        try {
            $OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new()
            $raw = & wsl.exe @wslArgs 2>&1 | ForEach-Object { "$_" }
            return ($raw -join [Environment]::NewLine)
        } finally {
            $OutputEncoding = $prev
        }
    } -ArgumentList (, $Args)
    if (-not (Wait-Job $job -Timeout $TimeoutSec)) {
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
        return "WSL command timed out after ${TimeoutSec}s"
    }
    $out = Receive-Job $job
    Remove-Job $job -ErrorAction SilentlyContinue
    return $out
}

function Test-DockerEngineReady {
    param([int]$TimeoutSec = 15)
    $cli = $script:DockerCli
    $job = Start-Job {
        param($cliPath)
        $ver = & $cliPath info --format '{{.ServerVersion}}' 2>$null
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace("$ver")) { return 'FAIL' }
        return "OK:$ver"
    } -ArgumentList $cli
    if (-not (Wait-Job $job -Timeout $TimeoutSec)) {
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
        return $false
    }
    $result = (Receive-Job $job | Select-Object -Last 1)
    Remove-Job $job -Force -ErrorAction SilentlyContinue
    return ("$result" -match '^OK:')
}

function Test-DockerInitStuck {
    $log = Join-Path $env:LOCALAPPDATA 'Docker\log\host\com.docker.backend.exe.log'
    if (-not (Test-Path -LiteralPath $log)) { return $false }
    $tail = Get-Content -LiteralPath $log -Tail 40 -ErrorAction SilentlyContinue
    return [bool]($tail | Where-Object { $_ -match 'still waiting for init control API' })
}

function Stop-StuckDockerEngine {
    Write-Host "`n=== Recycle stuck Docker engine ===" -ForegroundColor Yellow
    Write-Host "Quitting Docker Desktop once, then starting it fresh." -ForegroundColor Yellow

    foreach ($exe in $dockerExeCandidates) {
        if (Test-Path -LiteralPath $exe) {
            Start-Process -FilePath $exe -ArgumentList '--quit' -ErrorAction SilentlyContinue | Out-Null
        }
    }
    Start-Sleep -Seconds 3

    Get-Process 'Docker Desktop', 'com.docker.backend', 'com.docker.build' -ErrorAction SilentlyContinue |
        Stop-Process -Force -ErrorAction SilentlyContinue

    Write-Host "=== Shutdown WSL ===" -ForegroundColor Cyan
    $job = Start-Job { wsl --shutdown 2>$null }
    if (-not (Wait-Job $job -Timeout 20)) {
        Write-Host "wsl --shutdown timed out; forcing WSL processes to stop." -ForegroundColor Yellow
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
    } else {
        Receive-Job $job | Out-Null
        Remove-Job $job -ErrorAction SilentlyContinue
    }

    Stop-Process -Name 'vmwp', 'vmmemWSL', 'wslhost' -Force -ErrorAction SilentlyContinue
    Get-Process wsl -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

function Get-DockerStartupDiagnostics {
    $lines = New-Object System.Collections.Generic.List[string]

    $dockerLocal = "$env:LOCALAPPDATA\Docker"
    if (Test-Path $dockerLocal) {
        $item = Get-Item $dockerLocal -Force
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            $target = ($item.Target -join ';')
            $lines.Add("Docker data junction: $dockerLocal -> $target")
            if ($target -and -not (Test-Path $target)) {
                $lines.Add("Junction target is MISSING - Docker cannot start.")
            }
        }
    }

    $diskCandidates = @(
        (Join-Path $dockerLocal 'wsl\main\ext4.vhdx'),
        (Join-Path $dockerLocal 'wsl\disk\docker_data.vhdx')
    )
    $foundDisk = $false
    foreach ($disk in $diskCandidates) {
        if (Test-Path $disk) {
            $mb = [math]::Round((Get-Item $disk).Length / 1MB, 1)
            $lines.Add("Engine disk: $disk (${mb} MB)")
            $foundDisk = $true
        }
    }
    if (-not $foundDisk) {
        $lines.Add("Note: no ext4.vhdx/docker_data.vhdx under $dockerLocal (ignore if docker info works).")
    }

    $wslList = Invoke-WslText -Args @('-l', '-v')
    if ($wslList) {
        $lines.Add("WSL distros:`n$wslList")
    }

    $probe = Invoke-WslText -Args @('-d', 'docker-desktop', 'echo', 'ok')
    if ($probe -match 'ACCESSDENIED|Access is denied|MountDisk') {
        $lines.Add("WSL engine mount failed (this blocks Docker):")
        $lines.Add($probe.Trim())
        $lines.Add("Fix (Admin): .\scripts\fix-docker-mount-denied.ps1")
        $lines.Add("  (Docker data junction to D: causes this repeatedly - move back to C:)")
    } elseif ($probe -match 'ok') {
        $lines.Add("docker-desktop WSL distro responds.")
    } elseif ($probe.Trim()) {
        $lines.Add("docker-desktop probe: $($probe.Trim())")
    }

    $log = Join-Path $dockerLocal 'log\host\com.docker.backend.exe.log'
    if (Test-Path $log) {
        $tail = Get-Content $log -Tail 3 -ErrorAction SilentlyContinue
        if ($tail) {
            $lines.Add("Recent Docker log:")
            $tail | ForEach-Object { $lines.Add("  $_") }
        }
    }

    return $lines
}

Write-Host "=== Engine check ===" -ForegroundColor Cyan
# A busy engine (many JVMs booting) can take well over 15s to answer docker info.
# Recycling it runs wsl --shutdown and kills every running container, so only treat it as stuck after several slow tries.
$engineReady = $false
for ($probe = 1; $probe -le 4; $probe++) {
    if (Test-DockerEngineReady -TimeoutSec 30) { $engineReady = $true; break }
    if (-not (Get-Process 'Docker Desktop', 'com.docker.backend' -ErrorAction SilentlyContinue)) { break }
    Write-Host "docker info did not answer in 30s (try $probe/4) - engine may just be busy, retrying..." -ForegroundColor Yellow
}
if ($engineReady) {
    Write-Host "Docker engine is already running (docker info). Skipping WSL probes." -ForegroundColor Green
    & $script:DockerCli version
    exit 0
}

$runningUi = Get-Process 'Docker Desktop', 'com.docker.backend' -ErrorAction SilentlyContinue
$initStuck = Test-DockerInitStuck
if (-not $NoRecycle -and ($runningUi -or $initStuck)) {
    if ($runningUi) {
        Write-Host "Docker Desktop is running but the engine is not answering." -ForegroundColor Yellow
    } else {
        Write-Host "Docker backend log still shows init control API waiting." -ForegroundColor Yellow
    }
    Stop-StuckDockerEngine
}

Write-Host "`n=== Start Docker Desktop Service ===" -ForegroundColor Cyan
$svc = Get-Service com.docker.service -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -ne 'Running') {
    try {
        Start-Service com.docker.service -ErrorAction Stop
        Write-Host "Started com.docker.service"
    } catch {
        Write-Host "Could not start com.docker.service (try Run as Administrator): $($_.Exception.Message)" -ForegroundColor Yellow
    }
} elseif ($svc) {
    Write-Host "com.docker.service already running"
}

Write-Host "=== Launch Docker Desktop ===" -ForegroundColor Cyan
$runningUi = Get-Process 'Docker Desktop', 'com.docker.backend' -ErrorAction SilentlyContinue
if (-not $runningUi) {
    Start-Process $dockerExe
    Start-Sleep -Seconds 8
} else {
    Write-Host "Docker Desktop already running - waiting for engine..."
}

$waitStarted = Get-Date
$deadline = $waitStarted.AddSeconds($TimeoutSeconds)
$attempt = 0
while ((Get-Date) -lt $deadline) {
    $attempt++
    if (Test-DockerEngineReady) {
        Write-Host "Docker is ready (attempt $attempt)." -ForegroundColor Green
        & $script:DockerCli version
        & $script:DockerCli ps --format "table {{.Names}}\t{{.Status}}" 2>$null
        exit 0
    }

    $elapsed = [int]((Get-Date) - $waitStarted).TotalSeconds
    Write-Host "Waiting for Docker engine... ($attempt) [${elapsed}s / ${TimeoutSeconds}s]"
    Start-Sleep -Seconds 8
}

$elapsed = [int]((Get-Date) - $waitStarted).TotalSeconds
Write-Host "`nDocker did not become ready within $elapsed seconds (limit $TimeoutSeconds)." -ForegroundColor Red
Write-Host "`n=== Diagnostics ===" -ForegroundColor Yellow
foreach ($line in (Get-DockerStartupDiagnostics)) {
    if ($line -match 'ACCESSDENIED|Access is denied|missing|Fix:') {
        Write-Host $line -ForegroundColor Red
    } else {
        Write-Host $line
    }
}

Write-Host "`nRecommended fixes (in order):" -ForegroundColor Yellow
Write-Host "  0. If docker info already works:  .\scripts\sequences\00-common-platform.ps1 -SkipDockerStart -SkipMailHog" -ForegroundColor White
Write-Host "  1. Admin: .\scripts\fix-docker-mount-denied.ps1   (if ACCESS DENIED + D:\Docker junction)" -ForegroundColor White
Write-Host "  2. Admin: .\scripts\reset-docker-engine.ps1 -Force" -ForegroundColor White
Write-Host "  3. Reboot Windows, then: .\scripts\repair-docker.ps1" -ForegroundColor White
Write-Host "  4. Re-pull: .\scripts\pull-stack-images.ps1 -SkipMail" -ForegroundColor White
exit 1
