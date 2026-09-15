from sqlalchemy.orm import Session

from app.database import get_db


def get_db_session() -> Session:
    """FastAPI dependency that yields a database session."""
    yield from get_db()
