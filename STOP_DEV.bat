@echo off
cd /d "C:\Users\acer\Desktop\her_sey_yedek"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\dev-start.ps1" -Only stop
pause
