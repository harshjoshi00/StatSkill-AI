from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db
import time

router = APIRouter()

start_time = time.time()

@router.get("/")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint returning system status, DB connection, uptime, and demo mode.
    """
    db_connected = False
    pgvector_available = False
    
    try:
        # Check basic DB connectivity
        result = db.execute(text("SELECT 1;")).fetchone()
        if result and result[0] == 1:
            db_connected = True
            
        # Check pgvector extension availability
        vector_check = db.execute(
            text("SELECT count(*) FROM pg_extension WHERE extname = 'vector';")
        ).fetchone()
        if vector_check and vector_check[0] > 0:
            pgvector_available = True
    except Exception:
        db_connected = False
        pgvector_available = False

    uptime_seconds = round(time.time() - start_time, 2)

    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0",
        "demo_mode": settings.DEMO_MODE,
        "database": {
            "connected": db_connected,
            "pgvector_enabled": pgvector_available,
            "engine": "PostgreSQL 16"
        },
        "llm_provider": settings.LLM_PROVIDER,
        "uptime_seconds": uptime_seconds
    }
