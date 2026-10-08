<#
.SYNOPSIS
  Sequence 04 — SugamFlow CRM (crm-service + crm-ui).

.DESCRIPTION
  Optional: SEQ 00 for auth/gateway/subscription if you want entitlement checks.
  Local smoke default: entitlement OFF, Postgres crmdb on :5432.

  Starts:
    crm-service :8095  (profiles local,pilot-retail)
    crm-ui      :4500  (optional -WithUi)

.EXAMPLE
  # Local pilot (no FEATURE_CRM gate)
  .\scripts\sequences\04-crm.ps1 -WithUi

  # After common + subscription assigned
  .\scripts\sequences\00-common-platform.ps1
  .\scripts\sequences\04-crm.ps1 -RequireEntitlement -WithUi
#>
param(
    [string]$CrmServiceRoot = 'D:\sugamFlow\crm-service',
    [string]$CrmUiRoot = 'D:\sugamFlow\crm-ui',
    [switch]$WithUi,
    [switch]$RequireEntitlement,
    [switch]$SkipDbCheck,
    [switch]$RunSmoke,
    [switch]$SkipPackage,
    [int]$HealthTimeoutSec = 300
)

$ErrorActionPreference = 'Stop'

function Test-PortOpen([int]$Port) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $ok = $c.ConnectAsync('127.0.0.1', $Port).Wait(600)
        if ($ok -and $c.Connected) { $c.Close(); return $true }
        $c.Close()
        return $false
    } catch { return $false }
}

function Wait-Http([string]$Url, [int]$Seconds) {
    for ($i = 1; $i -le $Seconds; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { return $true }
        } catch { }
        if (($i % 15) -eq 0) {
            Write-Host ("  still waiting... {0}s / {1}s (watch the CRM cmd window for Maven errors)" -f $i, $Seconds) -ForegroundColor DarkGray
        }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Clear-PortJava([int]$Port) {
    $rows = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($row in $rows) {
        $proc = Get-Process -Id $row.OwningProcess -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -ieq 'java') {
            Write-Warning "Freeing :$Port (java PID $($proc.Id))"
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

function Ensure-CrmDb {
    $psqlCandidates = @(
        'C:\Program Files\PostgreSQL\17\bin\psql.exe',
        'C:\Program Files\PostgreSQL\16\bin\psql.exe',
        'C:\Program Files\PostgreSQL\15\bin\psql.exe'
    )
    $psql = $psqlCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $psql) {
        Write-Warning 'psql.exe not found — ensure database crmdb exists (user/pass crmdb).'
        return
    }
    $sql = Join-Path $CrmServiceRoot 'scripts\create-crmdb.sql'
    if (-not (Test-Path $sql)) {
        Write-Warning "Missing $sql"
        return
    }
    Write-Host 'Ensuring Postgres role/db crmdb...' -ForegroundColor Cyan
    $prev = $env:PGPASSWORD
    $env:PGPASSWORD = 'postgres'
    try {
        & $psql -U postgres -h localhost -f $sql | Out-Host
    } finally {
        if ($null -eq $prev) { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
        else { $env:PGPASSWORD = $prev }
    }
}

function Get-CrmJar {
    Get-ChildItem (Join-Path $CrmServiceRoot 'target\crm-service-*.jar') -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notmatch 'original' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}

Write-Host '========================================' -ForegroundColor Cyan
Write-Host ' SEQ 04 — CRM APPLICATION' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $CrmServiceRoot)) {
    throw "crm-service not found: $CrmServiceRoot"
}

if (-not $SkipDbCheck -and -not (Test-PortOpen 5432)) {
    throw 'PostgreSQL :5432 not listening. Start SEQ 00 or local Postgres (crmdb).'
}

if (-not $SkipDbCheck) {
    Ensure-CrmDb
}

if (-not $RequireEntitlement) {
    $env:CRM_ENTITLEMENT_ENABLED = 'false'
    Write-Host 'CRM_ENTITLEMENT_ENABLED=false (local pilot)' -ForegroundColor Yellow
} else {
    Remove-Item Env:CRM_ENTITLEMENT_ENABLED -ErrorAction SilentlyContinue
    Write-Host 'Entitlements ON — assign crm-professional to tenant' -ForegroundColor Yellow
}

if (Test-PortOpen 8095) {
    Write-Host 'crm-service already on :8095' -ForegroundColor DarkGray
} else {
    Clear-PortJava 8095

    $jar = Get-CrmJar
    if (-not $SkipPackage -and -not $jar) {
        Write-Host 'No jar yet — packaging crm-service (first build can take several minutes)...' -ForegroundColor Cyan
        Push-Location $CrmServiceRoot
        try {
            & mvn -DskipTests package
            if ($LASTEXITCODE -ne 0) { throw 'mvn package failed for crm-service — see errors above' }
        } finally {
            Pop-Location
        }
        $jar = Get-CrmJar
    }

    Write-Host 'Starting crm-service (new window)...' -ForegroundColor Cyan
    if ($jar) {
        Write-Host ("  jar: {0}" -f $jar.Name) -ForegroundColor DarkGray
        $ent = if ($env:CRM_ENTITLEMENT_ENABLED) { $env:CRM_ENTITLEMENT_ENABLED } else { '' }
        # One line: cmd /k stops at the first newline, so a here-string never reaches java.
        $cmd = "cd /d `"$CrmServiceRoot`" && set `"CRM_ENTITLEMENT_ENABLED=$ent`" && java -jar `"$($jar.FullName)`" --spring.profiles.active=local,pilot-retail"
    } else {
        $ent = if ($env:CRM_ENTITLEMENT_ENABLED) { $env:CRM_ENTITLEMENT_ENABLED } else { '' }
        $cmd = "cd /d `"$CrmServiceRoot`" && set `"CRM_ENTITLEMENT_ENABLED=$ent`" && mvn spring-boot:run `"-Dspring-boot.run.profiles=local,pilot-retail`""
    }
    Start-Process cmd.exe -ArgumentList '/k', $cmd

    Write-Host ("Waiting up to {0}s for http://localhost:8095/api/v1/crm/status ..." -f $HealthTimeoutSec) -ForegroundColor Cyan
    Write-Host '  Look at the new CMD window — Maven/Flyway errors appear there.' -ForegroundColor DarkGray
    if (-not (Wait-Http 'http://127.0.0.1:8095/api/v1/crm/status' $HealthTimeoutSec)) {
        throw @"
crm-service did not become ready on :8095.

Check the CRM cmd window for errors. Common fixes:
  1) Create DB:  & \"C:\Program Files\PostgreSQL\17\bin\psql.exe\" -U postgres -h localhost -f D:\sugamFlow\crm-service\scripts\create-crmdb.sql
  2) Manual start:
       cd D:\sugamFlow\crm-service
       `$env:CRM_ENTITLEMENT_ENABLED='false'
       mvn spring-boot:run \"-Dspring-boot.run.profiles=local,pilot-retail\"
  3) Re-run: .\scripts\sequences\04-crm.ps1 -HealthTimeoutSec 420
"@
    }
    Write-Host 'crm-service UP' -ForegroundColor Green
}

if ($WithUi) {
    if (-not (Test-Path -LiteralPath $CrmUiRoot)) {
        throw "crm-ui not found: $CrmUiRoot"
    }
    if (Test-PortOpen 4500) {
        Write-Host 'crm-ui already on :4500' -ForegroundColor DarkGray
    } else {
        Write-Host 'Starting crm-ui on :4500 (new window)...' -ForegroundColor Cyan
        Start-Process cmd.exe -ArgumentList '/k', "cd /d `"$CrmUiRoot`" && npm start"
    }
}

if ($RunSmoke) {
    $smoke = Join-Path $CrmServiceRoot 'scripts\pilot-smoke.ps1'
    if (Test-Path $smoke) {
        Write-Host 'Running pilot smoke...' -ForegroundColor Cyan
        & powershell -NoProfile -ExecutionPolicy Bypass -File $smoke -TenantId demo-crm
    }
}

Write-Host ''
Write-Host 'CRM API:  http://localhost:8095/api/v1/crm/status' -ForegroundColor Green
Write-Host 'CRM UI:   http://localhost:4500' -ForegroundColor Green
Write-Host 'Smoke:    cd D:\sugamFlow\crm-service; .\scripts\pilot-smoke.ps1' -ForegroundColor DarkGray
Write-Host 'Checklist: D:\school\docs\qa\CRM_PILOT_CHECKLIST.md' -ForegroundColor DarkGray
exit 0
