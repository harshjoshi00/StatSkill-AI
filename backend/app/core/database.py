from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Try primary PostgreSQL connection, fallback to SQLite if Postgres server is unavailable
try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        echo=False
    )
    # Test connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1;"))
    logger.info("Connected to primary PostgreSQL database.")
except Exception as e:
    logger.warning(f"PostgreSQL unavailable ({e}). Using local SQLite database for local dev/testing.")
    engine = create_engine(
        "sqlite:///./statskill.db",
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for obtaining database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Ensure vector extension / tables are created."""
    try:
        if "postgresql" in str(engine.url):
            with engine.connect() as connection:
                connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                connection.commit()
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.warning(f"Database table initialization warning: {e}")
        Base.metadata.create_all(bind=engine)
