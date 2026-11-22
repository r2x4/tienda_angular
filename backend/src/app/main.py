import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings, validate_runtime_security
from app.core.logging import configure_logging
from app.db.session import SessionLocal
from app.modules.auth.router import admin_users_router as auth_admin_users_router
from app.modules.auth.router import router as auth_router
from app.modules.cart.router import router as cart_router
from app.modules.catalog.router import admin_router as catalog_admin_router
from app.modules.catalog.router import public_router as catalog_public_router
from app.modules.orders.router import admin_router as orders_admin_router
from app.modules.orders.router import router as orders_router
from app.modules.services_admin.router import admin_router as services_admin_router
from app.modules.services_admin.router import public_router as services_public_router

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
    validate_runtime_security(settings)

    app = FastAPI(title=settings.app_name, version="0.1.0")

    cors_origins = settings.cors_origins_list()
    cors_methods = [m.strip().upper() for m in settings.cors_allowed_methods.split(",") if m.strip()]
    cors_headers = [h.strip() for h in settings.cors_allowed_headers.split(",") if h.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=cors_methods,
        allow_headers=cors_headers,
    )

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
    app.include_router(auth_admin_users_router)
    app.include_router(catalog_public_router)
    app.include_router(catalog_admin_router)
    app.include_router(services_public_router)
    app.include_router(services_admin_router)
    app.include_router(cart_router)
    app.include_router(orders_router)
    app.include_router(orders_admin_router)
    return app


app = create_app()
