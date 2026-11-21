"""Pydantic schemas for catalog module."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _validate_slug(value: str | None) -> str | None:
    if value is None:
        return value
    normalized = value.strip().lower().replace(" ", "-")
    if not normalized:
        raise ValueError("slug cannot be empty")
    allowed = "abcdefghijklmnopqrstuvwxyz0123456789-"
    if any(ch not in allowed for ch in normalized):
        raise ValueError("slug must contain only letters, numbers, and hyphens")
    return normalized


class CategoryBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str | None = Field(default=None, min_length=2, max_length=140)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool = True

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        return _validate_slug(value)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    slug: str | None = Field(default=None, min_length=2, max_length=140)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        return _validate_slug(value)


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ProductImageBase(BaseModel):
    url: str = Field(min_length=5, max_length=500)
    alt_text: str | None = Field(default=None, max_length=255)
    is_primary: bool = False
    sort_order: int = Field(default=0, ge=0)


class ProductImageCreate(ProductImageBase):
    pass


class ProductImageRead(ProductImageBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    created_at: datetime


class ProductBase(BaseModel):
    category_id: UUID
    name: str = Field(min_length=2, max_length=160)
    slug: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=5000)
    price_cop: Decimal = Field(ge=0, decimal_places=2)
    stock_quantity: int = Field(ge=0)
    is_active: bool = True
    images: list[ProductImageCreate] = Field(default_factory=list)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        return _validate_slug(value)

    @field_validator("price_cop")
    @classmethod
    def validate_price(cls, value: Decimal) -> Decimal:
        if value < 0:
            raise ValueError("price_cop must be >= 0")
        return value.quantize(Decimal("0.01"))


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    category_id: UUID | None = None
    name: str | None = Field(default=None, min_length=2, max_length=160)
    slug: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=5000)
    price_cop: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    stock_quantity: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    images: list[ProductImageCreate] | None = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        return _validate_slug(value)

    @field_validator("price_cop")
    @classmethod
    def validate_price(cls, value: Decimal | None) -> Decimal | None:
        if value is None:
            return value
        if value < 0:
            raise ValueError("price_cop must be >= 0")
        return value.quantize(Decimal("0.01"))


class CategorySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    is_active: bool


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    category_id: UUID
    name: str
    slug: str
    description: str | None
    price_cop: Decimal
    stock_quantity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category: CategorySummary | None = None
    images: list[ProductImageRead] = Field(default_factory=list)


class ProductAvailabilityRead(BaseModel):
    product_id: UUID
    stock_quantity: int
    is_active: bool
    available: bool
