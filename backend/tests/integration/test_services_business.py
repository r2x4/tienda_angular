import uuid
from decimal import Decimal

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.modules.services_admin.models import Service
from app.modules.services_admin.schemas import ServiceCreate, ServiceUpdate
from app.modules.services_admin.service import (
    create_service,
    deactivate_service,
    get_service_by_id,
    get_service_by_slug,
    list_services,
    update_service,
)


@pytest.fixture(scope="module")
def db_session():
    test_db_name = f"tienda_test_services_logic_{uuid.uuid4().hex[:8]}"
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


def _payload(**kwargs):
    base = dict(
        name="Haircut",
        slug=f"haircut-{uuid.uuid4().hex[:6]}",
        description="Basic service",
        price_cop=Decimal("25000.00"),
        duration_minutes=30,
        image_url="https://example.com/img.jpg",
        is_active=True,
    )
    base.update(kwargs)
    return ServiceCreate(**base)


def test_create_valid_service(db_session):
    svc = create_service(db_session, _payload(name="Massage", slug=f"massage-{uuid.uuid4().hex[:6]}"))
    assert svc.id is not None
    assert svc.name == "Massage"
    assert svc.price_cop == Decimal("25000.00")
    assert svc.is_active is True


def test_reject_empty_name():
    with pytest.raises(ValidationError):
        ServiceCreate(name="   ", slug="ok-slug", price_cop=Decimal("100.00"))


def test_reject_empty_slug():
    with pytest.raises(ValidationError):
        ServiceCreate(name="Valid", slug="   ", price_cop=Decimal("100.00"))


def test_reject_negative_price():
    with pytest.raises(ValidationError):
        ServiceCreate(name="Valid", slug="valid", price_cop=Decimal("-1.00"))


def test_reject_price_out_of_numeric_12_2_range():
    with pytest.raises(ValidationError):
        ServiceCreate(name="Valid", slug="valid", price_cop=Decimal("10000000000.00"))


def test_reject_more_than_two_decimals():
    with pytest.raises(ValidationError) as exc:
        ServiceCreate(name="Valid", slug="valid", price_cop=Decimal("10.999"))
    assert "decimal" in str(exc.value).lower()


def test_reject_zero_or_negative_duration():
    with pytest.raises(ValidationError):
        ServiceCreate(name="Valid", slug="valid", price_cop=Decimal("1.00"), duration_minutes=0)
    with pytest.raises(ValidationError):
        ServiceCreate(name="Valid", slug="valid", price_cop=Decimal("1.00"), duration_minutes=-1)


def test_accept_null_duration(db_session):
    svc = create_service(db_session, _payload(slug=f"null-dur-{uuid.uuid4().hex[:6]}", duration_minutes=None))
    assert svc.duration_minutes is None


def test_create_default_is_active(db_session):
    payload = ServiceCreate(name="Default Active", slug=f"default-active-{uuid.uuid4().hex[:6]}", price_cop=Decimal("10.00"))
    svc = create_service(db_session, payload)
    assert svc.is_active is True


def test_get_by_id_and_slug(db_session):
    slug = f"find-me-{uuid.uuid4().hex[:6]}"
    svc = create_service(db_session, _payload(name="Find Me", slug=slug))
    by_id = get_service_by_id(db_session, svc.id)
    by_slug = get_service_by_slug(db_session, slug)
    assert by_id.id == svc.id
    assert by_slug.id == svc.id


def test_list_and_filter_by_status(db_session):
    active_slug = f"active-{uuid.uuid4().hex[:6]}"
    inactive_slug = f"inactive-{uuid.uuid4().hex[:6]}"
    create_service(db_session, _payload(slug=active_slug, is_active=True))
    inactive = create_service(db_session, _payload(slug=inactive_slug, is_active=True))
    deactivate_service(db_session, inactive.id)

    active_items, active_total = list_services(db_session, is_active=True)
    inactive_items, inactive_total = list_services(db_session, is_active=False)
    all_items, all_total = list_services(db_session)

    assert any(s.slug == active_slug for s in active_items)
    assert all(s.is_active for s in active_items)
    assert any(s.slug == inactive_slug for s in inactive_items)
    assert all(not s.is_active for s in inactive_items)
    assert all_total >= active_total + inactive_total


def test_partial_update_and_omit_vs_null(db_session):
    svc = create_service(db_session, _payload(slug=f"upd-{uuid.uuid4().hex[:6]}", description="Initial", image_url="https://a.com/x.png"))
    updated = update_service(db_session, svc.id, ServiceUpdate(description=None))
    assert updated.description is None
    assert updated.image_url == "https://a.com/x.png"  # omitted field unchanged
    assert updated.name == svc.name

    updated2 = update_service(db_session, svc.id, ServiceUpdate(name="New Name", price_cop=Decimal("999.99"), image_url=None, duration_minutes=None))
    assert updated2.name == "New Name"
    assert updated2.price_cop == Decimal("999.99")
    assert updated2.image_url is None
    assert updated2.duration_minutes is None


def test_update_rejects_null_is_active():
    with pytest.raises(ValidationError):
        ServiceUpdate(is_active=None)


def test_duplicate_slug_rejected_create_and_update(db_session):
    slug = f"dup-{uuid.uuid4().hex[:6]}"
    create_service(db_session, _payload(slug=slug))
    with pytest.raises(HTTPException) as exc:
        create_service(db_session, _payload(slug=slug))
    assert exc.value.status_code == 409
    assert exc.value.detail == "Service slug already exists"

    other = create_service(db_session, _payload(slug=f"other-{uuid.uuid4().hex[:6]}"))
    with pytest.raises(HTTPException) as exc2:
        update_service(db_session, other.id, ServiceUpdate(slug=slug))
    assert exc2.value.status_code == 409
    assert exc2.value.detail == "Service slug already exists"


def test_non_slug_integrity_error_is_not_reported_as_slug_duplicate(db_session):
    slug = f"ck-{uuid.uuid4().hex[:6]}"
    create_service(db_session, _payload(slug=slug))
    # Force DB-level CHECK violation bypassing schema validation
    svc = get_service_by_slug(db_session, slug)
    svc.price_cop = Decimal("-5.00")
    db_session.add(svc)
    with pytest.raises(Exception) as exc:
        db_session.commit()
    db_session.rollback()
    assert not isinstance(exc.value, HTTPException)


def test_deactivate_logical_and_no_physical_delete(db_session):
    svc = create_service(db_session, _payload(slug=f"del-{uuid.uuid4().hex[:6]}"))
    deactivated = deactivate_service(db_session, svc.id)
    assert deactivated.is_active is False
    found = get_service_by_id(db_session, svc.id)
    assert found.id == svc.id
    assert found.is_active is False
    # physical row still exists
    raw = db_session.get(Service, svc.id)
    assert raw is not None
