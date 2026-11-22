"""Service business logic and data access."""

from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from psycopg.errors import UniqueViolation

from app.modules.services_admin.models import Service
from app.modules.services_admin.schemas import ServiceCreate, ServiceUpdate


MAX_PRICE_COP = Decimal("9999999999.99")


def _validate_slug(slug: str) -> str:
    normalized = slug.strip().lower().replace(" ", "-")
    allowed = "abcdefghijklmnopqrstuvwxyz0123456789-"
    if not normalized or any(ch not in allowed for ch in normalized):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid slug")
    return normalized


def _validate_price(price: Decimal) -> Decimal:
    if price < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="price_cop must be >= 0")
    if price > MAX_PRICE_COP:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="price_cop exceeds allowed range")
    if price != price.quantize(Decimal("0.01")):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="price_cop must have at most 2 decimal places")
    return price.quantize(Decimal("0.01"))


def _get_service_or_404(db: Session, service_id: UUID) -> Service:
    service = db.execute(select(Service).where(Service.id == service_id)).scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service


def _is_slug_unique_violation(exc: IntegrityError) -> bool:
    orig = exc.orig
    if isinstance(orig, UniqueViolation):
        constraint = getattr(getattr(orig, "diag", None), "constraint_name", None)
        return constraint == "uq_services_slug"
    return False


def create_service(db: Session, payload: ServiceCreate) -> Service:
    service = Service(
        name=payload.name.strip(),
        slug=_validate_slug(payload.slug),
        description=payload.description,
        price_cop=_validate_price(payload.price_cop),
        duration_minutes=payload.duration_minutes,
        image_url=payload.image_url.strip() if payload.image_url else payload.image_url,
        is_active=payload.is_active,
    )
    db.add(service)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if _is_slug_unique_violation(exc):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Service slug already exists") from exc
        raise
    db.refresh(service)
    return service


def get_service_by_id(db: Session, service_id: UUID) -> Service:
    return _get_service_or_404(db, service_id)


def get_service_by_slug(db: Session, slug: str) -> Service:
    normalized = _validate_slug(slug)
    service = db.execute(select(Service).where(Service.slug == normalized)).scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service


def list_services(db: Session, *, is_active: bool | None = None, skip: int = 0, limit: int = 100) -> tuple[list[Service], int]:
    stmt = select(Service)
    count_stmt = select(func.count()).select_from(Service)
    if is_active is not None:
        stmt = stmt.where(Service.is_active.is_(is_active))
        count_stmt = count_stmt.where(Service.is_active.is_(is_active))

    stmt = stmt.order_by(Service.created_at.desc()).offset(skip).limit(limit)
    items = list(db.execute(stmt).scalars().all())
    total = int(db.execute(count_stmt).scalar_one())
    return items, total


def update_service(db: Session, service_id: UUID, payload: ServiceUpdate) -> Service:
    service = _get_service_or_404(db, service_id)
    data = payload.model_dump(exclude_unset=True)

    if "name" in data and data["name"] is not None:
        service.name = data["name"].strip()
    if "slug" in data and data["slug"] is not None:
        service.slug = _validate_slug(data["slug"])
    if "description" in data:
        service.description = data["description"]
    if "price_cop" in data and data["price_cop"] is not None:
        service.price_cop = _validate_price(data["price_cop"])
    if "duration_minutes" in data:
        service.duration_minutes = data["duration_minutes"]
    if "image_url" in data:
        service.image_url = data["image_url"].strip() if isinstance(data["image_url"], str) else data["image_url"]
    if "is_active" in data and data["is_active"] is not None:
        service.is_active = data["is_active"]

    db.add(service)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if _is_slug_unique_violation(exc):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Service slug already exists") from exc
        raise
    db.refresh(service)
    return service


def deactivate_service(db: Session, service_id: UUID) -> Service:
    service = _get_service_or_404(db, service_id)
    service.is_active = False
    db.add(service)
    db.commit()
    db.refresh(service)
    return service
