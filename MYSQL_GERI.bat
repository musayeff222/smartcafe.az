@echo off

setlocal EnableExtensions

title SmartCafe — MySQL berpa



set "ROOT=%~dp0"

if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"



echo.

echo ===== MySQL berpa (canli baza) =====

echo.



powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\use-live-mysql.ps1"

if errorlevel 2 (

  echo.

  echo Tunel acilmirsa: START_FULL_DEV.bat isledin

  echo ve "SSH-MySQL-Tunnel" penceresini baglamayin.

  pause

  exit /b 2

)

if errorlevel 1 (

  pause

  exit /b 1

)



powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\start-mysql-tunnel.ps1"



echo.

echo [OK] MySQL hazirdir. API: php artisan serve  ve ya START_FULL_DEV.bat

echo.

pause

