"""Orders service with transactional checkout."""

import logging
from datetime import datetime, timezone
from decimal import Decimal
from secrets import token_hex
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.tokens import generate_refresh_token, hash_refresh_token
from app.modules.auth.models import User
from app.modules.cart.models import Cart, CartItem
from app.modules.cart.service import resolve_cart
from app.modules.catalog.models import Category, Product
from app.modules.orders.idempotency import build_idempotency_scope
from app.modules.orders.models import Order, OrderItem, OrderStatus
from app.modules.orders.schemas import CheckoutRequest, OrderCreateResponse, OrderRead

logger = logging.getLogger(__name__)


def _money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"))


def _generate_order_number() -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"ORD-{ts}-{token_hex(3).upper()}"


def _order_query():
    return select(Order).options(selectinload(Order.items))


def _get_order_or_404(db: Session, order_id: UUID) -> Order:
    order = db.execute(_order_query().where(Order.id == order_id)).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def _validate_buyer(payload: CheckoutRequest, current_user: User | None) -> None:
    if not current_user and not payload.buyer:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Buyer information is required for guest checkout")


def _find_idempotent_order(db: Session, *, idempotency_key: str, scope: str) -> Order | None:
    return db.execute(
        _order_query().where(Order.idempotency_key == idempotency_key, Order.idempotency_scope == scope)
    ).scalar_one_or_none()


def checkout(
    db: Session,
    *,
    current_user: User | None,
    guest_cart_token: str | None,
    payload: CheckoutRequest,
) -> OrderCreateResponse:
    cart, _ = resolve_cart(db, current_user=current_user, guest_cart_token=guest_cart_token, create_if_missing=False)
    scope = build_idempotency_scope(user_id=current_user.id if current_user else None, cart=cart)

    if payload.idempotency_key and scope:
        existing = _find_idempotent_order(db, idempotency_key=payload.idempotency_key, scope=scope)
        if existing:
            return OrderCreateResponse(order=OrderRead.model_validate(existing), guest_order_access_token=None)

    if not cart or not cart.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    _validate_buyer(payload, current_user)

    try:
        with db.begin_nested() if db.in_transaction() else db.begin():
            cart_db = db.execute(
                select(Cart).where(Cart.id == cart.id).options(selectinload(Cart.items))
            ).scalar_one_or_none()
            if not cart_db or not cart_db.items:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

            scope_db = build_idempotency_scope(user_id=current_user.id if current_user else None, cart=cart_db)
            if payload.idempotency_key and scope_db:
                existing = _find_idempotent_order(db, idempotency_key=payload.idempotency_key, scope=scope_db)
                if existing:
                    return OrderCreateResponse(order=OrderRead.model_validate(existing), guest_order_access_token=None)

            product_ids = sorted({item.product_id for item in cart_db.items}, key=lambda x: str(x))
            products = list(
                db.execute(select(Product).where(Product.id.in_(product_ids)).with_for_update()).scalars().all()
            )
            prod_map = {p.id: p for p in products}
            if len(prod_map) != len(product_ids):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more products not found")

            order_items: list[OrderItem] = []
            subtotal = Decimal("0.00")
            for item in sorted(cart_db.items, key=lambda i: str(i.product_id)):
                product = prod_map.get(item.product_id)
                if not product:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
                if not product.is_active:
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Product inactive: {product.name}")
                category_active = db.execute(
                    select(Category.is_active).where(Category.id == product.category_id)
                ).scalar_one_or_none()
                if category_active is False:
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Product unavailable: {product.name}")
                if item.quantity <= 0:
                    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid quantity")
                if product.stock_quantity < item.quantity:
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Insufficient stock for {product.name}")

                unit_price = _money(Decimal(str(product.price_cop)))
                line_total = _money(unit_price * item.quantity)
                subtotal = _money(subtotal + line_total)

                res = db.execute(
                    update(Product)
                    .where(Product.id == product.id, Product.stock_quantity >= item.quantity, Product.is_active.is_(True))
                    .values(stock_quantity=Product.stock_quantity - item.quantity)
                )
                if res.rowcount != 1:
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Insufficient stock for {product.name}")

                order_items.append(
                    OrderItem(
                        product_id=product.id,
                        product_name=product.name,
                        product_slug=product.slug,
                        unit_price_cop=unit_price,
                        quantity=item.quantity,
                        line_total_cop=line_total,
                    )
                )

            guest_access_token = None
            guest_access_hash = None
            guest_email = guest_full_name = guest_phone = guest_address = None
            if not current_user:
                buyer = payload.buyer
                assert buyer is not None
                guest_email = buyer.email.lower()
                guest_full_name = buyer.full_name.strip()
                guest_phone = buyer.phone
                guest_address = buyer.address.strip()
                guest_access_token = generate_refresh_token()
                guest_access_hash = hash_refresh_token(guest_access_token)
            elif payload.buyer:
                guest_email = payload.buyer.email.lower()
                guest_full_name = payload.buyer.full_name.strip()
                guest_phone = payload.buyer.phone
                guest_address = payload.buyer.address.strip()

            order = Order(
                order_number=_generate_order_number(),
                user_id=current_user.id if current_user else None,
                guest_email=guest_email,
                guest_full_name=guest_full_name,
                guest_phone=guest_phone,
                guest_address=guest_address,
                guest_access_token_hash=guest_access_hash,
                status=OrderStatus.CONFIRMED,
                currency="COP",
                subtotal=subtotal,
                total=subtotal,
                idempotency_key=payload.idempotency_key,
                idempotency_scope=scope_db if payload.idempotency_key else None,
                items=order_items,
            )
            db.add(order)
            for citem in list(cart_db.items):
                db.delete(citem)
            db.add(cart_db)
            db.flush()
            order_id = order.id

        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        if payload.idempotency_key and scope:
            existing = _find_idempotent_order(db, idempotency_key=payload.idempotency_key, scope=scope)
            if existing:
                return OrderCreateResponse(order=OrderRead.model_validate(existing), guest_order_access_token=None)
        logger.warning("Checkout integrity conflict")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Checkout conflict")
    except Exception:
        db.rollback()
        logger.exception("Checkout failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Checkout failed")

    created = db.execute(_order_query().where(Order.id == order_id)).scalar_one()
    return OrderCreateResponse(order=OrderRead.model_validate(created), guest_order_access_token=guest_access_token)


def list_my_orders(db: Session, *, current_user: User) -> list[Order]:
    stmt = _order_query().where(Order.user_id == current_user.id).order_by(Order.created_at.desc())
    return list(db.execute(stmt).scalars().all())


def get_my_order(db: Session, *, current_user: User, order_id: UUID) -> Order:
    order = _get_order_or_404(db, order_id)
    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def list_orders_admin(db: Session) -> list[Order]:
    stmt = _order_query().order_by(Order.created_at.desc())
    return list(db.execute(stmt).scalars().all())


def get_order_admin(db: Session, order_id: UUID) -> Order:
    return _get_order_or_404(db, order_id)


def get_guest_order(db: Session, *, order_id: UUID, guest_access_token: str) -> Order:
    order = _get_order_or_404(db, order_id)
    if not order.guest_access_token_hash:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if hash_refresh_token(guest_access_token) != order.guest_access_token_hash:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order
