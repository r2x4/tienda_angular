"""Scope idempotency keys for checkout to prevent cross-buyer reuse."""

from uuid import UUID

from app.modules.cart.models import Cart


def build_idempotency_scope(*, user_id: UUID | None, cart: Cart | None) -> str | None:
    if user_id:
        return f"user:{user_id}"
    if cart and cart.guest_token_hash:
        return f"guest:{cart.guest_token_hash}"
    return None
