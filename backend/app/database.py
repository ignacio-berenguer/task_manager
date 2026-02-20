"""
Database connection setup for the backend API.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path

from app.config import settings

# Calculate database path: use configured path or auto-detect relative to project root
if settings.DATABASE_PATH:
    _db_path = Path(settings.DATABASE_PATH)
else:
    _backend_dir = Path(__file__).parent.parent
    _project_root = _backend_dir.parent
    _db_path = _project_root / "db" / "portfolio.db"

DATABASE_URL = f"sqlite:///{_db_path}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite specific
    echo=settings.DATABASE_ECHO,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
