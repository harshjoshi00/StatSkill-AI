@echo off
echo ==============================================
echo   StatSkill AI - Starting Frontend Dashboard
echo ==============================================

cd frontend

if not exist node_modules (
    echo [*] node_modules not found. Installing dependencies via npm...
    npm install
)

echo.
echo [*] Launching Next.js Dev Server on http://localhost:3000 ...
echo.
npm run dev
pause
