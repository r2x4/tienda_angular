import logging

from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.logging import configure_logging
from app.db.session import SessionLocal
from app.modules.auth.router import router as auth_router
from app.modules.catalog.router import admin_router as catalog_admin_router
from app.modules.catalog.router import public_router as catalog_public_router

logger = logging.getLogger(__name__)


def check_database_connection() -> tuple[bool, str | None]:
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return True, None
    except SQLAlchemyError as exc:
        logger.exception("Database health check failed")
        return False, str(exc.__class__.__name__)


def create_app() -> FastAPI:
    configure_logging(settings.log_level)
    app = FastAPI(title=settings.app_name, version="0.1.0")

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        db_ok, db_error = check_database_connection()
        status = "ok" if db_ok else "degraded"
        response = {
            "status": status,
            "app": settings.app_name,
            "environment": settings.app_env,
            "database": "up" if db_ok else "down",
        }
        if db_error:
            response["database_error"] = db_error
        return response

    app.include_router(auth_router)
    app.include_router(catalog_public_router)
    app.include_router(catalog_admin_router)
    return app


app = create_app()
