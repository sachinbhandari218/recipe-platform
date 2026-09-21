@echo off
start /b java Server
timeout /t 2 >nul
:loop
cloudflared.exe tunnel --url http://localhost:8080
timeout /t 5 >nul
goto loop
