"""Pydantic schemas for services."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_PRICE_COP = Decimal("9999999999.99")


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


def _validate_price(value: Decimal | None) -> Decimal | None:
    if value is None:
        return value
    if value < 0:
        raise ValueError("price_cop must be >= 0")
    if value > MAX_PRICE_COP:
        raise ValueError("price_cop exceeds allowed range")
    if value != value.quantize(Decimal("0.01")):
        raise ValueError("price_cop must have at most 2 decimal places")
    return value.quantize(Decimal("0.01"))


class ServiceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    slug: str = Field(min_length=1, max_length=180)
    description: str | None = Field(default=None)
    price_cop: Decimal = Field(ge=0, decimal_places=2)
    duration_minutes: int | None = Field(default=None, gt=0)
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("name cannot be empty")
        return normalized

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str) -> str:
        normalized = _validate_slug(value)
        if normalized is None:
            raise ValueError("slug cannot be empty")
        return normalized

    @field_validator("price_cop")
    @classmethod
    def validate_price(cls, value: Decimal) -> Decimal:
        validated = _validate_price(value)
        assert validated is not None
        return validated


class ServiceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=160)
    slug: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = Field(default=None)
    price_cop: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    duration_minutes: int | None = Field(default=None, gt=0)
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            raise ValueError("name cannot be empty")
        return normalized

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _validate_slug(value)

    @field_validator("price_cop")
    @classmethod
    def validate_price(cls, value: Decimal | None) -> Decimal | None:
        return _validate_price(value)

    @field_validator("is_active")
    @classmethod
    def validate_is_active(cls, value: bool | None) -> bool | None:
        if value is None:
            raise ValueError("is_active cannot be null; omit the field to keep current value")
        return value


class ServiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    description: str | None
    price_cop: Decimal
    duration_minutes: int | None
    image_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ServiceListResponse(BaseModel):
    items: list[ServiceRead]
    total: int
    skip: int
    limit: int
