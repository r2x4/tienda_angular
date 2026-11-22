"""Cart schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CartItemAddRequest(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0, le=100)


class CartItemUpdateRequest(BaseModel):
    quantity: int = Field(gt=0, le=100)


class CartProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    price_cop: Decimal
    is_active: bool
    stock_quantity: int


class CartItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    quantity: int
    unit_price_cop: Decimal
    line_total_cop: Decimal
    created_at: datetime
    updated_at: datetime
    product: CartProductRead


class CartRead(BaseModel):
    id: UUID
    user_id: UUID | None
    guest_cart_token: str | None = None
    items: list[CartItemRead]
    subtotal_cop: Decimal
    total_cop: Decimal
    currency: str = "COP"
    created_at: datetime
    updated_at: datetime
