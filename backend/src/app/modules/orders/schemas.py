"""Order schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BuyerInfo(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    address: str = Field(min_length=5, max_length=1000)


class CheckoutRequest(BaseModel):
    buyer: BuyerInfo | None = None
    idempotency_key: str | None = Field(default=None, min_length=8, max_length=128)


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID | None
    product_name: str
    product_slug: str
    unit_price_cop: Decimal
    quantity: int
    line_total_cop: Decimal


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_number: str
    user_id: UUID | None
    status: str
    currency: str
    subtotal: Decimal
    total: Decimal
    created_at: datetime
    items: list[OrderItemRead]


class OrderCreateResponse(BaseModel):
    order: OrderRead
    guest_order_access_token: str | None = None
