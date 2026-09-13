@echo off
cd /d "%~dp0"
echo SmartCafe marketing — lokal server
echo URL: http://127.0.0.1:5500
echo Dayandirmaq: Ctrl+C
echo.
php -S 127.0.0.1:5500 -t .
pause
