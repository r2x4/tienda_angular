import os

import pytest
from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine


def test_database_url_is_configured() -> None:
    assert settings.database_url
    assert settings.database_url.startswith("postgresql+psycopg://")


def test_sqlalchemy_engine_connects() -> None:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        assert result.scalar() == 1


def test_session_local_can_execute_query() -> None:
    db: Session = SessionLocal()
    try:
        result = db.execute(text("SELECT 1 AS ok"))
        assert result.scalar() == 1
    finally:
        db.close()


def test_base_metadata_is_declarative() -> None:
    assert isinstance(Base.metadata.tables, dict)


def test_model_registry_importable() -> None:
    import app.db.model_registry  # noqa: F401
