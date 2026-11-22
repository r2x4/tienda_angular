"""Orders routers."""

from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_optional, get_guest_cart_token, require_roles
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.orders.schemas import CheckoutRequest, OrderCreateResponse, OrderRead
from app.modules.orders.service import (
    checkout,
    get_guest_order,
    get_my_order,
    get_order_admin,
    list_my_orders,
    list_orders_admin,
)

router = APIRouter(prefix="/orders", tags=["orders"])
admin_router = APIRouter(prefix="/admin/orders", tags=["admin-orders"])


@router.post("/checkout", response_model=OrderCreateResponse, status_code=status.HTTP_201_CREATED)
def checkout_order(
    payload: CheckoutRequest,
    current_user: User | None = Depends(get_current_user_optional),
    guest_cart_token: str | None = Depends(get_guest_cart_token),
    db: Session = Depends(get_db),
) -> OrderCreateResponse:
    return checkout(db, current_user=current_user, guest_cart_token=guest_cart_token, payload=payload)


@router.get("/my", response_model=list[OrderRead])
def my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OrderRead]:
    return [OrderRead.model_validate(o) for o in list_my_orders(db, current_user=current_user)]


@router.get("/my/{order_id}", response_model=OrderRead)
def my_order_detail(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderRead:
    return OrderRead.model_validate(get_my_order(db, current_user=current_user, order_id=order_id))


@router.get("/guest/{order_id}", response_model=OrderRead)
def guest_order_detail(
    order_id: UUID,
    x_order_access_token: str | None = Header(default=None, alias="X-Order-Access-Token"),
    db: Session = Depends(get_db),
) -> OrderRead:
    if not x_order_access_token or len(x_order_access_token.strip()) < 20:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return OrderRead.model_validate(get_guest_order(db, order_id=order_id, guest_access_token=x_order_access_token.strip()))


@admin_router.get("", response_model=list[OrderRead])
def admin_orders(
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> list[OrderRead]:
    return [OrderRead.model_validate(o) for o in list_orders_admin(db)]


@admin_router.get("/{order_id}", response_model=OrderRead)
def admin_order_detail(
    order_id: UUID,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> OrderRead:
    return OrderRead.model_validate(get_order_admin(db, order_id))
