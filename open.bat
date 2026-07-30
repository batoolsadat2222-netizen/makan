@echo off
chcp 65001 >nul
cd /d "%~dp0"
curl.exe -s -o NUL -w "%%{http_code}" http://127.0.0.1:8080/api/health 2>nul | findstr "200" >nul
if errorlevel 1 wscript.exe "%~dp0start-daemon.vbs"
start "" "http://localhost:8080"
