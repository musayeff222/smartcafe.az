@echo off
setlocal EnableExtensions
title SmartCafe Frontend
cd /d "%~dp0..\front"
if errorlevel 1 (
  echo [X] front qovluguna kecile bilmedi: %~dp0..\front
  pause
  exit /b 1
)
if not exist "node_modules\react-scripts\package.json" (
  echo npm install...
  call npm install
  if errorlevel 1 (
    echo [X] npm install ugursuz
    pause
    exit /b 1
  )
)
echo React dev server baslayir: http://localhost:3000
echo.
call npm run dev
pause
