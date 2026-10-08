<#
.SYNOPSIS
  Build Docker images (and School jars) by application sequence 00–04.

.DESCRIPTION
  SEQ 00–02 / 04 = Docker Compose images under D:\sugamFlow (via build-docker.ps1).
  SEQ 03 = School domain Maven jars under D:\school (not Docker by default).

  Always builds shared bases first (sugamflow-common-libs:local + sugamflow-jre:local)
  when any Docker sequence is requested.

.EXAMPLE
  # Build common + retail + clinic images for local IMAGE_TAG
  .\scripts\sequences\build-by-sequence.ps1 -Seq 00,01,02

  # Build + push production tags
  .\scripts\sequences\build-by-sequence.ps1 -Seq 00,01,02 -Push -Tag 1.0.3

  # School jars only
  .\scripts\sequences\build-by-sequence.ps1 -Seq 03

  # Everything Docker + school
  .\scripts\sequences\build-by-sequence.ps1 -Seq 00,01,02,03,04
#>
param(
    # One or more: 00, 01, 02, 03, 04  (aliases: 0,1,2,3,4 / common,retail,clinic,school,crm)
    [Parameter(Mandatory = $true)]
    [string[]]$Seq,

    [string]$Tag = '',
    [string]$Prefix = '',
    [string]$SchoolRoot = 'D:\school',
    [string]$SugamFlowRoot = 'D:\sugamFlow',

    [int]$Parallel = 1,
    [switch]$RebuildCommonLibs,
    [switch]$UseMcrBase,
    [switch]$Push,
    [switch]$SkipBases
)

$ErrorActionPreference = 'Stop'

$repoRoot = $SugamFlowRoot
if (-not (Test-Path (Join-Path $repoRoot 'build-docker.ps1'))) {
    $repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
}
Set-Location $repoRoot

. (Join-Path $repoRoot 'scripts\repo-powershell.ps1')
Initialize-DockerCliPath

function Get-EnvLocalValue {
    param([string]$Key, [string]$Default)
    $envFile = Join-Path $repoRoot '.env.local'
    if (-not (Test-Path -LiteralPath $envFile)) { return $Default }
    foreach ($line in Get-Content -LiteralPath $envFile) {
        if ($line -match "^\s*$Key=(.+)$") { return $Matches[1].Trim() }
    }
    return $Default
}

if (-not $Prefix) { $Prefix = Get-EnvLocalValue -Key 'IMAGE_PREFIX' -Default 'sumanthakur30' }
if (-not $Tag) { $Tag = Get-EnvLocalValue -Key 'IMAGE_TAG' -Default '1.0.2' }

$env:IMAGE_PREFIX = $Prefix
$env:IMAGE_TAG = $Tag
$env:ORDER_IMAGE_TAG = $Tag
$env:COMPOSE_ENV_FILES = '.env.local'

# --- Service maps (compose service names) ---
$seqServices = [ordered]@{
    '00' = @(
        'config-service',
        'discovery-service',
        'auth-service',
        'shop-service',
        'user-service',
        'notification-service',
        'gateway-service'
    )
    '01' = @(
        'product-service',
        'stock-service',
        'order-service',
        'payment-service',
        'reporting-service',
        'account-service',
        'fieldforce-service',
        'gst-service',
        'ledger-service',
        'gst-mock-service'
    )
    '02' = @(
        'doctor-service',
        'appointment-service',
        'queue-management-service'
    )
    '04' = @(
        'crm-service'
    )
}

function Normalize-SeqToken([string]$t) {
    $x = $t.Trim().ToLowerInvariant()
    switch ($x) {
        { $_ -in @('0', '00', 'common', 'a2') } { return '00' }
        { $_ -in @('1', '01', 'retail', 'shop', 'a3') } { return '01' }
        { $_ -in @('2', '02', 'clinic', 'hospital', 'polyclinic') } { return '02' }
        { $_ -in @('3', '03', 'school') } { return '03' }
        { $_ -in @('4', '04', 'crm') } { return '04' }
        default { throw "Unknown sequence '$t'. Use 00,01,02,03,04" }
    }
}

$wanted = [System.Collections.Generic.List[string]]::new()
foreach ($t in $Seq) {
    foreach ($part in @($t -split '[,;\s]+' | Where-Object { $_ })) {
        $n = Normalize-SeqToken $part
        if (-not $wanted.Contains($n)) { [void]$wanted.Add($n) }
    }
}

Write-Host '========================================' -ForegroundColor Cyan
Write-Host ' BUILD BY SEQUENCE' -ForegroundColor Cyan
Write-Host " Root:   $repoRoot" -ForegroundColor DarkGray
Write-Host " Prefix: $Prefix" -ForegroundColor DarkGray
Write-Host " Tag:    $Tag" -ForegroundColor DarkGray
Write-Host (" Seq:    " + ($wanted -join ', ')) -ForegroundColor DarkGray
Write-Host '========================================' -ForegroundColor Cyan

$dockerSeqs = @($wanted | Where-Object { $_ -ne '03' })
$needSchool = $wanted.Contains('03')

# --- Docker builds ---
if ($dockerSeqs.Count -gt 0) {
    $services = [System.Collections.Generic.List[string]]::new()
    foreach ($s in $dockerSeqs) {
        foreach ($svc in $seqServices[$s]) {
            if (-not $services.Contains($svc)) { [void]$services.Add($svc) }
        }
    }

    Write-Host ''
    Write-Host 'Docker services to build:' -ForegroundColor Green
    $services | ForEach-Object { Write-Host "  - $_" -ForegroundColor DarkGray }

    $buildScript = Join-Path $repoRoot 'build-docker.ps1'
    $svcArray = [string[]]@($services)
    # Splatting a VARIABLE (not an inline @{...}) is required on Windows PowerShell.
    $bd = @{
        Parallel = $Parallel
        Services = $svcArray
    }
    if ($RebuildCommonLibs) { $bd['RebuildCommonLibs'] = $true }
    if ($UseMcrBase) { $bd['UseMcrBase'] = $true }
    if ($SkipBases) {
        Write-Host 'SkipBases: relying on existing sugamflow-common-libs:local / jre' -ForegroundColor Yellow
    }

    & $buildScript @bd
    if ($LASTEXITCODE -ne 0) { throw "build-docker.ps1 failed for: $($svcArray -join ', ')" }

    Write-Host ''
    Write-Host "Images tagged as ${Prefix}/<service>:${Tag}" -ForegroundColor Green

    if ($Push) {
        Write-Host ''
        Write-Host "Pushing ${Prefix}/*:${Tag} ..." -ForegroundColor Cyan
        foreach ($svc in $services) {
            $image = "${Prefix}/${svc}:${Tag}"
            # order-service may use ORDER_IMAGE_TAG — same Tag here
            Write-Host "  docker push $image" -ForegroundColor DarkGray
            $code = 0
            $prev = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            & docker push $image
            $code = $LASTEXITCODE
            $ErrorActionPreference = $prev
            if ($code -ne 0) { throw "Push failed: $image" }
        }
        Write-Host 'Push complete.' -ForegroundColor Green
    }
}

# --- School (SEQ 03) Maven jars ---
if ($needSchool) {
    Write-Host ''
    Write-Host '========================================' -ForegroundColor Cyan
    Write-Host ' SEQ 03 — SCHOOL ERP (Maven jars)' -ForegroundColor Cyan
    Write-Host '========================================' -ForegroundColor Cyan

    if (-not (Test-Path $SchoolRoot)) {
        throw "School repo not found: $SchoolRoot"
    }

    $schoolServices = @(
        'school-settings-service',
        'subscription-service',
        'form-builder-service',
        'workflow-service',
        'rule-engine-service',
        'report-builder-service',
        'school-notification-config-service',
        'audit-service',
        'admission-service',
        'fee-service',
        'student-service',
        'attendance-service',
        'exam-service',
        'library-service',
        'hostel-service',
        'transport-service',
        'payroll-service',
        'staff-service',
        'academic-structure-service'
    )

    Write-Host 'Building school multi-module (skipTests)...' -ForegroundColor Cyan
    Push-Location (Join-Path $SchoolRoot 'services')
    try {
        & mvn -q -DskipTests package
        if ($LASTEXITCODE -ne 0) { throw 'mvn package failed for school services' }
    } finally {
        Pop-Location
    }

    Write-Host 'School jars expected under services\<name>\target\' -ForegroundColor Green
    foreach ($n in $schoolServices) {
        $jars = Get-ChildItem (Join-Path $SchoolRoot "services\$n\target\$n-*.jar") -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -notmatch 'original' }
        if ($jars) {
            Write-Host ("  OK  {0}" -f $jars[0].Name) -ForegroundColor DarkGray
        } else {
            Write-Warning "  Missing jar: $n"
        }
    }
}

Write-Host ''
Write-Host '== BUILD DONE ==' -ForegroundColor Green
Write-Host ''
Write-Host 'Next — start sequences (after images/jars exist):' -ForegroundColor Yellow
Write-Host '  .\scripts\sequences\00-common-platform.ps1 -SkipMailHog'
Write-Host '  .\scripts\sequences\01-sugamflow-retail.ps1'
Write-Host '  .\scripts\sequences\02-hospital-polyclinic.ps1'
Write-Host '  .\scripts\sequences\03-school-erp.ps1 -WithUi'
Write-Host '  .\scripts\sequences\04-crm.ps1 -WithUi'
exit 0
