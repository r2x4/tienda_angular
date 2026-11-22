"""Cart router."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_optional, get_guest_cart_token
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.cart.schemas import CartItemAddRequest, CartItemUpdateRequest, CartRead
from app.modules.cart.service import add_item, clear_cart, get_cart_response, remove_item, update_item_quantity

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartRead)
def get_cart(
    current_user: User | None = Depends(get_current_user_optional),
    guest_cart_token: str | None = Depends(get_guest_cart_token),
    db: Session = Depends(get_db),
) -> CartRead:
    # create_if_missing true: guest gets token on first cart interaction
    return get_cart_response(db, current_user=current_user, guest_cart_token=guest_cart_token, create_if_missing=True)


@router.post("/items", response_model=CartRead, status_code=status.HTTP_201_CREATED)
def add_cart_item(
    payload: CartItemAddRequest,
    current_user: User | None = Depends(get_current_user_optional),
    guest_cart_token: str | None = Depends(get_guest_cart_token),
    db: Session = Depends(get_db),
) -> CartRead:
    return add_item(
        db,
        current_user=current_user,
        guest_cart_token=guest_cart_token,
        product_id=payload.product_id,
        quantity=payload.quantity,
    )


@router.patch("/items/{product_id}", response_model=CartRead)
def patch_cart_item(
    product_id: UUID,
    payload: CartItemUpdateRequest,
    current_user: User | None = Depends(get_current_user_optional),
    guest_cart_token: str | None = Depends(get_guest_cart_token),
    db: Session = Depends(get_db),
) -> CartRead:
    return update_item_quantity(
        db,
        current_user=current_user,
        guest_cart_token=guest_cart_token,
        product_id=product_id,
        quantity=payload.quantity,
    )


@router.delete("/items/{product_id}", response_model=CartRead)
def delete_cart_item(
    product_id: UUID,
    current_user: User | None = Depends(get_current_user_optional),
    guest_cart_token: str | None = Depends(get_guest_cart_token),
    db: Session = Depends(get_db),
) -> CartRead:
    return remove_item(db, current_user=current_user, guest_cart_token=guest_cart_token, product_id=product_id)


@router.delete("", response_model=CartRead)
def delete_cart(
    current_user: User | None = Depends(get_current_user_optional),
    guest_cart_token: str | None = Depends(get_guest_cart_token),
    db: Session = Depends(get_db),
) -> CartRead:
    return clear_cart(db, current_user=current_user, guest_cart_token=guest_cart_token)
