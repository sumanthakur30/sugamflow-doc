<#
.SYNOPSIS
  Shared stop for common platform + optional School / SugamFlow app layers.
  Prevents port confusion by stopping school jars (8181-8199) and/or Docker stack cleanly.

.EXAMPLE
  .\scripts\stop-shared-runtime.ps1 -School
  .\scripts\stop-shared-runtime.ps1 -School -CommonDocker
  .\scripts\stop-shared-runtime.ps1 -All
#>
param(
  [switch]$School,
  [switch]$SchoolUi,
  [switch]$CommonDocker,
  [switch]$All,
  [string]$SchoolRoot = 'D:\school',
  [string]$SugamFlowRoot = 'D:\sugamFlow'
)
$ErrorActionPreference = 'Continue'
if ($All) { $School = $true; $SchoolUi = $true; $CommonDocker = $true }
if (-not ($School -or $SchoolUi -or $CommonDocker)) {
  Write-Host 'Specify -School and/or -SchoolUi and/or -CommonDocker (or -All)' -ForegroundColor Yellow
  exit 1
}

function Stop-ListenersOnPorts([int[]]$Ports, [string]$Label) {
  $killed = @{}
  foreach ($port in $Ports) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
      $procId = $_.OwningProcess
      if ($procId -and -not $killed.ContainsKey($procId)) {
        try {
          $p = Get-CimInstance Win32_Process -Filter "ProcessId=$procId" -ErrorAction SilentlyContinue
          Stop-Process -Id $procId -Force -ErrorAction Stop
          $killed[$procId] = $true
          Write-Host "Stopped $Label pid=$procId port=$port ($($p.Name))"
        } catch {
          Write-Warning "Could not stop pid=$procId on :$port - $($_.Exception.Message)"
        }
      }
    }
  }
  return $killed.Count
}

if ($School) {
  Write-Host '== Stopping School domain services (:8181-8199) ==' -ForegroundColor Yellow
  $n = Stop-ListenersOnPorts -Ports @(8181..8199) -Label 'school-port'
  # Also kill any leftover school jars not bound yet
  Get-CimInstance Win32_Process -Filter "Name='java.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and ($_.CommandLine -match '\\school\\services\\' -or $_.CommandLine -match '/school/services/') } |
    ForEach-Object {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
      Write-Host "Stopped school JVM pid=$($_.ProcessId)"
    }
  Write-Host "School stop done (port kills=$n)" -ForegroundColor Green
}

if ($SchoolUi) {
  Write-Host '== Stopping School UI (:4300) ==' -ForegroundColor Yellow
  Stop-ListenersOnPorts -Ports @(4300) -Label 'school-ui' | Out-Null
  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and ($_.CommandLine -match 'school-ui' -and $_.CommandLine -match 'ng serve|node.*4300') } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

if ($CommonDocker) {
  Write-Host '== Stopping common Docker stack (keeps Docker Desktop) ==' -ForegroundColor Yellow
  $daily = Join-Path $PSScriptRoot 'daily-stop-sugamflow.ps1'
  if (Test-Path $daily) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File $daily
  } else {
    Push-Location $SugamFlowRoot
    try {
      $envFile = Join-Path $SugamFlowRoot '.env.local'
      docker compose --env-file $envFile down
    } finally { Pop-Location }
  }
}

Write-Host '== Shared stop complete ==' -ForegroundColor Green
