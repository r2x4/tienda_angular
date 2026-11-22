"""Cart service."""

from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.tokens import generate_refresh_token, hash_refresh_token
from app.modules.auth.models import User
from app.modules.cart.models import Cart, CartItem
from app.modules.cart.schemas import CartItemRead, CartProductRead, CartRead
from app.modules.catalog.models import Product


def _money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"))


def _cart_query():
    return select(Cart).options(selectinload(Cart.items).selectinload(CartItem.product))


def _get_cart_by_user(db: Session, user_id: UUID) -> Cart | None:
    return db.execute(_cart_query().where(Cart.user_id == user_id)).scalar_one_or_none()


def _get_cart_by_guest_hash(db: Session, guest_hash: str) -> Cart | None:
    return db.execute(_cart_query().where(Cart.guest_token_hash == guest_hash)).scalar_one_or_none()


def _create_guest_cart(db: Session) -> tuple[Cart, str]:
    raw_token = generate_refresh_token()
    cart = Cart(guest_token_hash=hash_refresh_token(raw_token))
    db.add(cart)
    db.commit()
    db.refresh(cart)
    cart = db.execute(_cart_query().where(Cart.id == cart.id)).scalar_one()
    return cart, raw_token


def _merge_guest_cart_into_user(db: Session, user_cart: Cart, guest_cart: Cart) -> Cart:
    for g_item in list(guest_cart.items):
        existing = next((i for i in user_cart.items if i.product_id == g_item.product_id), None)
        if existing:
            existing.quantity += g_item.quantity
            db.add(existing)
        else:
            db.add(CartItem(cart_id=user_cart.id, product_id=g_item.product_id, quantity=g_item.quantity))
    db.delete(guest_cart)
    db.commit()
    return db.execute(_cart_query().where(Cart.id == user_cart.id)).scalar_one()


def resolve_cart(db: Session, *, current_user: User | None, guest_cart_token: str | None, create_if_missing: bool) -> tuple[Cart | None, str | None]:
    guest_hash = hash_refresh_token(guest_cart_token) if guest_cart_token else None
    guest_cart = _get_cart_by_guest_hash(db, guest_hash) if guest_hash else None

    if current_user:
        user_cart = _get_cart_by_user(db, current_user.id)
        if guest_cart:
            if not user_cart:
                guest_cart.user_id = current_user.id
                guest_cart.guest_token_hash = None
                db.add(guest_cart)
                db.commit()
                user_cart = db.execute(_cart_query().where(Cart.id == guest_cart.id)).scalar_one()
            elif guest_cart.id != user_cart.id:
                user_cart = _merge_guest_cart_into_user(db, user_cart, guest_cart)
            return user_cart, None

        if user_cart:
            return user_cart, None
        if create_if_missing:
            user_cart = Cart(user_id=current_user.id)
            db.add(user_cart)
            db.commit()
            return db.execute(_cart_query().where(Cart.id == user_cart.id)).scalar_one(), None
        return None, None

    if guest_cart:
        return guest_cart, guest_cart_token
    if create_if_missing:
        return _create_guest_cart(db)
    return None, None


def _serialize_cart(cart: Cart, guest_cart_token: str | None) -> CartRead:
    items: list[CartItemRead] = []
    subtotal = Decimal("0.00")
    for item in cart.items:
        product = item.product
        unit = _money(Decimal(str(product.price_cop)))
        line = _money(unit * item.quantity)
        subtotal += line
        items.append(
            CartItemRead(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price_cop=unit,
                line_total_cop=line,
                created_at=item.created_at,
                updated_at=item.updated_at,
                product=CartProductRead.model_validate(product),
            )
        )
    subtotal = _money(subtotal)
    return CartRead(
        id=cart.id,
        user_id=cart.user_id,
        guest_cart_token=guest_cart_token if cart.user_id is None else None,
        items=items,
        subtotal_cop=subtotal,
        total_cop=subtotal,
        currency="COP",
        created_at=cart.created_at,
        updated_at=cart.updated_at,
    )


def get_cart_response(db: Session, *, current_user: User | None, guest_cart_token: str | None, create_if_missing: bool = True) -> CartRead:
    cart, token = resolve_cart(db, current_user=current_user, guest_cart_token=guest_cart_token, create_if_missing=create_if_missing)
    if not cart:
        # empty transient response for guest without cart
        now = None
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found")
    return _serialize_cart(cart, token)


def add_item(db: Session, *, current_user: User | None, guest_cart_token: str | None, product_id: UUID, quantity: int) -> CartRead:
    cart, token = resolve_cart(db, current_user=current_user, guest_cart_token=guest_cart_token, create_if_missing=True)
    assert cart is not None

    product = db.execute(select(Product).where(Product.id == product_id)).scalar_one_or_none()
    if not product or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not available")
    if product.category and not product.category.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not available")

    item = next((i for i in cart.items if i.product_id == product_id), None)
    new_qty = quantity if not item else item.quantity + quantity
    if new_qty <= 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid quantity")
    if new_qty > product.stock_quantity:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Insufficient stock")

    if item:
        item.quantity = new_qty
        db.add(item)
    else:
        db.add(CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity))

    db.commit()
    cart = db.execute(_cart_query().where(Cart.id == cart.id)).scalar_one()
    return _serialize_cart(cart, token)


def update_item_quantity(db: Session, *, current_user: User | None, guest_cart_token: str | None, product_id: UUID, quantity: int) -> CartRead:
    cart, token = resolve_cart(db, current_user=current_user, guest_cart_token=guest_cart_token, create_if_missing=False)
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found")

    item = next((i for i in cart.items if i.product_id == product_id), None)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    product = db.execute(select(Product).where(Product.id == product_id)).scalar_one_or_none()
    if not product or not product.is_active:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product not available")
    if quantity > product.stock_quantity:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Insufficient stock")

    item.quantity = quantity
    db.add(item)
    db.commit()
    cart = db.execute(_cart_query().where(Cart.id == cart.id)).scalar_one()
    return _serialize_cart(cart, token)


def remove_item(db: Session, *, current_user: User | None, guest_cart_token: str | None, product_id: UUID) -> CartRead:
    cart, token = resolve_cart(db, current_user=current_user, guest_cart_token=guest_cart_token, create_if_missing=False)
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found")
    item = next((i for i in cart.items if i.product_id == product_id), None)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    db.delete(item)
    db.commit()
    cart = db.execute(_cart_query().where(Cart.id == cart.id)).scalar_one()
    return _serialize_cart(cart, token)


def clear_cart(db: Session, *, current_user: User | None, guest_cart_token: str | None) -> CartRead:
    cart, token = resolve_cart(db, current_user=current_user, guest_cart_token=guest_cart_token, create_if_missing=True)
    assert cart is not None
    for item in list(cart.items):
        db.delete(item)
    db.commit()
    cart = db.execute(_cart_query().where(Cart.id == cart.id)).scalar_one()
    return _serialize_cart(cart, token)
