"""Services API routers (public and admin)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.services_admin.schemas import ServiceCreate, ServiceListResponse, ServiceRead, ServiceUpdate
from app.modules.services_admin.service import (
    create_service,
    deactivate_service,
    get_service_by_id,
    list_services,
    update_service,
)

public_router = APIRouter(prefix="/services", tags=["services"])
admin_router = APIRouter(prefix="/admin/services", tags=["admin-services"])


@public_router.get("", response_model=ServiceListResponse)
def public_list_services(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
) -> ServiceListResponse:
    items, total = list_services(db, is_active=True, skip=skip, limit=limit)
    return ServiceListResponse(
        items=[ServiceRead.model_validate(s) for s in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@public_router.get("/{service_id}", response_model=ServiceRead)
def public_get_service(service_id: UUID, db: Session = Depends(get_db)) -> ServiceRead:
    service = get_service_by_id(db, service_id)
    if not service.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return ServiceRead.model_validate(service)


@admin_router.get("", response_model=ServiceListResponse)
def admin_list_services(
    is_active: bool | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> ServiceListResponse:
    items, total = list_services(db, is_active=is_active, skip=skip, limit=limit)
    return ServiceListResponse(
        items=[ServiceRead.model_validate(s) for s in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@admin_router.post("", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
def admin_create_service(
    payload: ServiceCreate,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> ServiceRead:
    return ServiceRead.model_validate(create_service(db, payload))


@admin_router.get("/{service_id}", response_model=ServiceRead)
def admin_get_service(
    service_id: UUID,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> ServiceRead:
    return ServiceRead.model_validate(get_service_by_id(db, service_id))


@admin_router.patch("/{service_id}", response_model=ServiceRead)
def admin_update_service(
    service_id: UUID,
    payload: ServiceUpdate,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> ServiceRead:
    return ServiceRead.model_validate(update_service(db, service_id, payload))


@admin_router.patch("/{service_id}/activate", response_model=ServiceRead)
def admin_activate_service(
    service_id: UUID,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> ServiceRead:
    return ServiceRead.model_validate(update_service(db, service_id, ServiceUpdate(is_active=True)))


@admin_router.patch("/{service_id}/deactivate", response_model=ServiceRead)
def admin_deactivate_service(
    service_id: UUID,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> ServiceRead:
    return ServiceRead.model_validate(deactivate_service(db, service_id))
