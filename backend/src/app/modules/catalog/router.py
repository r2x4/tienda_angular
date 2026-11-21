"""Catalog API routers (public and admin)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.catalog.schemas import (
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
    ProductAvailabilityRead,
    ProductCreate,
    ProductRead,
    ProductUpdate,
)
from app.modules.catalog.service import (
    create_category,
    create_product,
    deactivate_category,
    deactivate_product,
    get_category,
    get_product,
    list_categories,
    list_products,
    update_category,
    update_product,
)

public_router = APIRouter(prefix="/catalog", tags=["catalog"])
admin_router = APIRouter(prefix="/admin/catalog", tags=["admin-catalog"])


# Public endpoints
@public_router.get("/categories", response_model=list[CategoryRead])
def public_list_categories(db: Session = Depends(get_db)) -> list[CategoryRead]:
    return [CategoryRead.model_validate(c) for c in list_categories(db, active_only=True)]


@public_router.get("/categories/{category_id}", response_model=CategoryRead)
def public_get_category(category_id: UUID, db: Session = Depends(get_db)) -> CategoryRead:
    return CategoryRead.model_validate(get_category(db, category_id, active_only=True))


@public_router.get("/products", response_model=list[ProductRead])
def public_list_products(
    category_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[ProductRead]:
    return [ProductRead.model_validate(p) for p in list_products(db, active_only=True, category_id=category_id)]


@public_router.get("/products/{product_id}", response_model=ProductRead)
def public_get_product(product_id: UUID, db: Session = Depends(get_db)) -> ProductRead:
    return ProductRead.model_validate(get_product(db, product_id, active_only=True))


@public_router.get("/products/{product_id}/availability", response_model=ProductAvailabilityRead)
def public_get_product_availability(product_id: UUID, db: Session = Depends(get_db)) -> ProductAvailabilityRead:
    product = get_product(db, product_id, active_only=True)
    return ProductAvailabilityRead(
        product_id=product.id,
        stock_quantity=product.stock_quantity,
        is_active=product.is_active,
        available=product.is_active and product.stock_quantity > 0,
    )


# Admin endpoints
@admin_router.get("/categories", response_model=list[CategoryRead])
def admin_list_categories(
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> list[CategoryRead]:
    return [CategoryRead.model_validate(c) for c in list_categories(db, active_only=False)]


@admin_router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def admin_create_category(
    payload: CategoryCreate,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> CategoryRead:
    return CategoryRead.model_validate(create_category(db, payload))


@admin_router.get("/categories/{category_id}", response_model=CategoryRead)
def admin_get_category(
    category_id: UUID,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> CategoryRead:
    return CategoryRead.model_validate(get_category(db, category_id, active_only=False))


@admin_router.put("/categories/{category_id}", response_model=CategoryRead)
def admin_update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> CategoryRead:
    return CategoryRead.model_validate(update_category(db, category_id, payload))


@admin_router.patch("/categories/{category_id}/deactivate", response_model=CategoryRead)
def admin_deactivate_category(
    category_id: UUID,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> CategoryRead:
    return CategoryRead.model_validate(deactivate_category(db, category_id))


@admin_router.get("/products", response_model=list[ProductRead])
def admin_list_products(
    category_id: UUID | None = Query(default=None),
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> list[ProductRead]:
    return [ProductRead.model_validate(p) for p in list_products(db, active_only=False, category_id=category_id)]


@admin_router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def admin_create_product(
    payload: ProductCreate,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> ProductRead:
    return ProductRead.model_validate(create_product(db, payload))


@admin_router.get("/products/{product_id}", response_model=ProductRead)
def admin_get_product(
    product_id: UUID,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> ProductRead:
    return ProductRead.model_validate(get_product(db, product_id, active_only=False))


@admin_router.put("/products/{product_id}", response_model=ProductRead)
def admin_update_product(
    product_id: UUID,
    payload: ProductUpdate,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> ProductRead:
    return ProductRead.model_validate(update_product(db, product_id, payload))


@admin_router.patch("/products/{product_id}/deactivate", response_model=ProductRead)
def admin_deactivate_product(
    product_id: UUID,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> ProductRead:
    return ProductRead.model_validate(deactivate_product(db, product_id))
