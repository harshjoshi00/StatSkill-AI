from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import api_router
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("statskill_backend")

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Skill Intelligence and Capacity Building Platform for India's Official Statistical System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router under both /api/v1 and /api for route flexibility
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
def startup_event():
    logger.info("Initializing StatSkill AI Backend Service...")
    init_db()

@app.get("/")
def root():
    return {
        "message": "Welcome to StatSkill AI API",
        "docs": "/docs",
        "health": "/api/v1/health/"
    }
