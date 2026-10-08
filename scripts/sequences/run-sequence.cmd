@echo off
REM Run sequenced application starts OR builds OR login-stack repair.
REM   sequences\run-sequence.cmd 00
REM   sequences\run-sequence.cmd build 00,01,02
REM   sequences\run-sequence.cmd login
setlocal
cd /d "%~dp0\..\.."
if "%~1"=="" (
  echo Usage: run-sequence.cmd 00^|01^|02^|03^|04
  echo        run-sequence.cmd build 00,01,02
  echo        run-sequence.cmd login
  echo See scripts\sequences\README.md
  exit /b 1
)
if /I "%~1"=="login" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0\..\ensure-login-stack.ps1" %2 %3 %4
  exit /b %ERRORLEVEL%
)
if /I "%~1"=="build" (
  if "%~2"=="" (
    echo Usage: run-sequence.cmd build 00,01,02
    exit /b 1
  )
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0\build-by-sequence.ps1" -Seq "%~2" %3 %4 %5 %6 %7 %8
  exit /b %ERRORLEVEL%
)
set SEQ=%~1
if "%SEQ%"=="00" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0\00-common-platform.ps1" -SkipMailHog %2 %3 %4
if "%SEQ%"=="01" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0\01-sugamflow-retail.ps1" %2 %3 %4
if "%SEQ%"=="02" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0\02-hospital-polyclinic.ps1" %2 %3 %4
if "%SEQ%"=="03" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0\03-school-erp.ps1" %2 %3 %4
if "%SEQ%"=="04" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0\04-crm.ps1" %2 %3 %4
exit /b %ERRORLEVEL%
