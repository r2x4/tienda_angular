import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import create_app
from app.modules.auth.models import Role, User
from app.modules.auth.service import ROLE_ADMIN, ROLE_CUSTOMER


@pytest.fixture(scope="session")
def setup_test_database():
    test_db_name = f"tienda_test_{uuid.uuid4().hex[:8]}"
    admin_url = (
        f"postgresql+psycopg://{settings.postgres_user}:{settings.postgres_password}"
        f"@{settings.postgres_host}:{settings.postgres_port}/postgres"
    )
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        conn.execute(text(f"DROP DATABASE IF EXISTS {test_db_name}"))
        conn.execute(text(f"CREATE DATABASE {test_db_name}"))
    admin_engine.dispose()

    test_db_url = (
        f"postgresql+psycopg://{settings.postgres_user}:{settings.postgres_password}"
        f"@{settings.postgres_host}:{settings.postgres_port}/{test_db_name}"
    )
    engine = create_engine(test_db_url, pool_pre_ping=True)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    Base.metadata.create_all(bind=engine)

    app = create_app()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # seed roles and admin user
    with TestingSessionLocal() as db:
        admin_role = Role(code=ROLE_ADMIN, name="Administrator")
        customer_role = Role(code=ROLE_CUSTOMER, name="Customer")
        db.add_all([admin_role, customer_role])
        db.commit()
        db.refresh(admin_role)
        admin_user = User(
            email="admin@example.com",
            username="admin_test",
            password_hash=hash_password("AdminPass123!"),
            is_active=True,
        )
        admin_user.roles.append(admin_role)
        db.add(admin_user)
        db.commit()

    with TestClient(app) as client:
        yield client, TestingSessionLocal

    Base.metadata.drop_all(bind=engine)
    engine.dispose()

    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        conn.execute(
            text(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                f"WHERE datname = '{test_db_name}' AND pid <> pg_backend_pid()"
            )
        )
        conn.execute(text(f"DROP DATABASE IF EXISTS {test_db_name}"))
    admin_engine.dispose()
