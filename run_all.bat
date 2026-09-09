@echo off
echo ========================================================
echo        StatSkill AI - One-Click Project Launcher
echo ========================================================

:: Copy .env.example to .env if missing
if not exist .env (
    echo [*] Creating root .env from .env.example ...
    copy .env.example .env
)
if not exist backend\.env (
    echo [*] Creating backend/.env from .env.example ...
    copy .env.example backend\.env
)

echo [*] Launching Backend Service in a new terminal...
start "StatSkill Backend API (Port 8000)" cmd /k "call run_backend.bat"

echo [*] Launching Frontend Dashboard in a new terminal...
start "StatSkill Frontend App (Port 3000)" cmd /k "call run_frontend.bat"

echo.
echo ========================================================
echo   Services are starting up!
echo   Frontend Dashboard : http://localhost:3000
echo   Backend API Docs   : http://localhost:8000/docs
echo   Backend Health     : http://localhost:8000/api/v1/health/
echo ========================================================
echo.
pause
