@echo off
chcp 65001 >nul
title نصب اجرای همیشگی ماکان
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js نصب نیست. از https://nodejs.org نصب کنید.
  pause
  exit /b 1
)

set "DAEMON=%~dp0start-daemon.vbs"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo.
echo  ═══════════════════════════════════════
echo    نصب اجرای همیشگی ماکان
echo  ═══════════════════════════════════════
echo.

:: 1) Startup folder
powershell -NoProfile -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%STARTUP%\ماکان.lnk'); $s.TargetPath='%DAEMON%'; $s.WorkingDirectory='%~dp0'; $s.WindowStyle=7; $s.Description='ماکان — سرور'; $s.Save()"
echo [✓] Startup ویندوز

:: 2) Task Scheduler — هر ۵ دقیقه بررسی
schtasks /Create /TN "MakanServer" /TR "wscript.exe \"%DAEMON%\"" /SC ONLOGON /RL LIMITED /F >nul 2>&1
schtasks /Create /TN "MakanWatchdog" /TR "wscript.exe \"%DAEMON%\"" /SC MINUTE /MO 5 /RL LIMITED /F >nul 2>&1
echo [✓] Task Scheduler (ورود + هر ۵ دقیقه)

:: 3) همین الان سرور را بالا بیاور
wscript.exe "%DAEMON%"
echo [✓] سرور در حال راه‌اندازی...

echo.
echo  ✓ انجام شد!
echo.
echo  لینk ثابت: http://localhost:8080
echo.
echo  از این به بعد ماکان:
echo    • با روشن شدن ویندوز خودکار اجرا می‌شود
echo    • هر ۵ دقیقه بررسی می‌شود — اگر خاموش بود دوباره بالا می‌آید
echo.
echo  برای باز کردن سایت: start.bat یا لینk بالا
echo.
pause
