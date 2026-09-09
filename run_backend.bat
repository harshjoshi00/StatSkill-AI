@echo off
echo ==============================================
echo   StatSkill AI - Starting Backend API
echo ==============================================

cd backend

if not exist .env (
    echo [!] backend/.env not found, copying from ../.env.example ...
    copy ..\.env.example .env
)

if not exist venv (
    echo [*] Creating virtual environment (venv)...
    python -m venv venv
)

call venv\Scripts\activate

echo [*] Installing/Verifying Python dependencies...
pip install -r requirements.txt

if not exist statskill.db (
    echo [*] Initializing and seeding local database...
    python -c "from app.utils.seed import seed_database; seed_database()"
)

echo.
echo [*] Launching FastAPI Backend on http://localhost:8000 ...
echo [*] Interactive API Docs available at http://localhost:8000/docs
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
