import uuid
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.modules.services_admin.models import Service


@pytest.fixture(scope="module")
def db_session():
    test_db_name = f"tienda_test_services_{uuid.uuid4().hex[:8]}"
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

    with TestingSessionLocal() as session:
        yield session

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


def _create_service(db_session, **kwargs):
    defaults = dict(
        name="Service 1",
        slug=f"service-{uuid.uuid4().hex[:8]}",
        description="Desc",
        price_cop=Decimal("10000.00"),
        duration_minutes=60,
        image_url="https://example.com/svc.jpg",
        is_active=True,
    )
    defaults.update(kwargs)
    obj = Service(**defaults)
    db_session.add(obj)
    db_session.commit()
    db_session.refresh(obj)
    return obj


def test_insert_valid_service(db_session):
    svc = _create_service(db_session)
    assert svc.id is not None
    assert svc.name == "Service 1"
    assert svc.price_cop == Decimal("10000.00")
    assert svc.duration_minutes == 60
    assert svc.is_active is True
    assert svc.created_at is not None
    assert svc.updated_at is not None


def test_price_zero_allowed(db_session):
    svc = _create_service(db_session, slug=f"service-{uuid.uuid4().hex[:8]}", price_cop=Decimal("0.00"))
    assert svc.price_cop == Decimal("0.00")


def test_negative_price_rejected(db_session):
    with pytest.raises(IntegrityError):
        _create_service(db_session, slug=f"service-{uuid.uuid4().hex[:8]}", price_cop=Decimal("-1.00"))
    db_session.rollback()


def test_positive_duration_allowed_and_null_allowed(db_session):
    svc = _create_service(db_session, slug=f"service-{uuid.uuid4().hex[:8]}", duration_minutes=1)
    assert svc.duration_minutes == 1
    svc2 = _create_service(db_session, slug=f"service-{uuid.uuid4().hex[:8]}", duration_minutes=None)
    assert svc2.duration_minutes is None


def test_zero_or_negative_duration_rejected(db_session):
    with pytest.raises(IntegrityError):
        _create_service(db_session, slug=f"service-{uuid.uuid4().hex[:8]}", duration_minutes=0)
    db_session.rollback()
    with pytest.raises(IntegrityError):
        _create_service(db_session, slug=f"service-{uuid.uuid4().hex[:8]}", duration_minutes=-5)
    db_session.rollback()


def test_duplicate_slug_rejected(db_session):
    slug = f"service-{uuid.uuid4().hex[:8]}"
    _create_service(db_session, slug=slug)
    with pytest.raises(IntegrityError):
        _create_service(db_session, slug=slug)
    db_session.rollback()


def test_is_active_default_true(db_session):
    svc = Service(name="No active set", slug=f"service-{uuid.uuid4().hex[:8]}", price_cop=Decimal("1.00"))
    db_session.add(svc)
    db_session.commit()
    db_session.refresh(svc)
    assert svc.is_active is True
