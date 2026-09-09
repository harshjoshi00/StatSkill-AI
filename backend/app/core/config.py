import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    APP_NAME: str = "StatSkill AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api"
    DEMO_MODE: bool = True

    # Database
    POSTGRES_USER: str = "statskill"
    POSTGRES_PASSWORD: str = "statskill_secret"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "statskill_db"
    DATABASE_URL: str = "postgresql://statskill:statskill_secret@localhost:5432/statskill_db"

    # Security
    JWT_SECRET: str = "super_secret_jwt_key_statskill_ai_2026_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # AI / LLM
    LLM_PROVIDER: str = "openai"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    VECTOR_DIMENSION: int = 384
    SIMILARITY_THRESHOLD: float = 0.40    # minimum cosine similarity to accept a skill match

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
