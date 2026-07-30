@echo off
chcp 65001 >nul
title ماکان
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js نصب نیست. از https://nodejs.org نصب کنید.
  pause
  exit /b 1
)

:: اگر سرور روشن است، فقط مرورگر
curl.exe -s -o NUL -w "%%{http_code}" http://127.0.0.1:8080/api/health 2>nul | findstr "200" >nul
if not errorlevel 1 (
  echo ✓ ماکان در حال اجراست.
  start "" "http://localhost:8080"
  exit /b 0
)

echo.
echo  ═══════════════════════════════════
echo    ماکان — راه‌اندازی...
echo  ═══════════════════════════════════
echo.

if not exist "client\dist\index.html" (
  echo [1/2] ساخت سایت...
  cd client
  call npm run build
  if errorlevel 1 (
    echo خطا در ساخت. npm install را در پوشه client اجرا کنید.
    pause
    exit /b 1
  )
  cd ..
) else (
  echo [✓] سایت آماده است
)

echo [2/2] اجرای سرور...
wscript.exe "%~dp0start-daemon.vbs"

echo منتظر آماده شدن...
set /a n=0
:wait
timeout /t 1 /nobreak >nul
curl.exe -s -o NUL -w "%%{http_code}" http://127.0.0.1:8080/api/health 2>nul | findstr "200" >nul
if not errorlevel 1 goto ready
set /a n+=1
if %n% lss 45 goto wait

echo ⚠ سرور دیر بالا آمد — چند ثانیه صبر کنید و refresh کنید.
goto open

:ready
echo.
echo  ✓ ماکان آماده است!

:open
echo.
echo  لینk: http://localhost:8080
echo.
start "" "http://localhost:8080"
echo.
echo  برای اجرای همیشگی: install-always-on.bat
echo.
timeout /t 3 /nobreak >nul
