@echo off
REM Telefon/digər cihazlardan eyni WiFi üzərindən local-a qoşulmaq üçün.
REM Firewall port açmaq üçün admin rejimində işlədilir (UAC soruşa bilər).

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Admin hüquqları istənir (firewall port-u üçün)...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cd /d "C:\Users\acer\Desktop\her_sey_yedek"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\dev-start.ps1" -Lan
echo.
echo LAN dev sunuculari ayri pencerelerde calisiyor.
echo Telefondan yuxaridaki URL-e daxil olun.
echo Bu pencereyi kapatabilirsiniz.
pause
