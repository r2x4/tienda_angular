"""Catalog service layer."""

from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.modules.catalog.models import Category, Product, ProductImage
from app.modules.catalog.schemas import CategoryCreate, CategoryUpdate, ProductCreate, ProductUpdate


def _slugify(value: str) -> str:
    normalized = value.strip().lower().replace(" ", "-")
    allowed = "abcdefghijklmnopqrstuvwxyz0123456789-"
    cleaned = "".join(ch for ch in normalized if ch in allowed)
    while "--" in cleaned:
        cleaned = cleaned.replace("--", "-")
    return cleaned.strip("-")


def _ensure_category_slug(db: Session, name: str, slug: str | None, exclude_id: UUID | None = None) -> str:
    base = _slugify(slug or name)
    if not base:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid slug")
    candidate = base
    i = 2
    while True:
        stmt = select(Category).where(Category.slug == candidate)
        if exclude_id:
            stmt = stmt.where(Category.id != exclude_id)
        exists = db.execute(stmt).scalar_one_or_none()
        if not exists:
            return candidate
        candidate = f"{base}-{i}"
        i += 1


def _ensure_product_slug(db: Session, name: str, slug: str | None, exclude_id: UUID | None = None) -> str:
    base = _slugify(slug or name)
    if not base:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid slug")
    candidate = base
    i = 2
    while True:
        stmt = select(Product).where(Product.slug == candidate)
        if exclude_id:
            stmt = stmt.where(Product.id != exclude_id)
        exists = db.execute(stmt).scalar_one_or_none()
        if not exists:
            return candidate
        candidate = f"{base}-{i}"
        i += 1


# Categories

def list_categories(db: Session, *, active_only: bool) -> list[Category]:
    stmt = select(Category).order_by(Category.name.asc())
    if active_only:
        stmt = stmt.where(Category.is_active.is_(True))
    return list(db.execute(stmt).scalars().all())


def get_category(db: Session, category_id: UUID, *, active_only: bool) -> Category:
    stmt = select(Category).where(Category.id == category_id)
    if active_only:
        stmt = stmt.where(Category.is_active.is_(True))
    category = db.execute(stmt).scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


def create_category(db: Session, payload: CategoryCreate) -> Category:
    slug = _ensure_category_slug(db, payload.name, payload.slug)
    category = Category(
        name=payload.name.strip(),
        slug=slug,
        description=payload.description,
        is_active=payload.is_active,
    )
    db.add(category)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists") from exc
    db.refresh(category)
    return category


def update_category(db: Session, category_id: UUID, payload: CategoryUpdate) -> Category:
    category = get_category(db, category_id, active_only=False)
    data = payload.model_dump(exclude_unset=True)

    if "name" in data or "slug" in data:
        name = data.get("name", category.name)
        slug = data.get("slug", category.slug)
        category.slug = _ensure_category_slug(db, name, slug, exclude_id=category.id)

    for field, value in data.items():
        if field == "slug":
            continue
        if field == "name" and isinstance(value, str):
            value = value.strip()
        setattr(category, field, value)

    db.add(category)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category conflict") from exc
    db.refresh(category)
    return category


def deactivate_category(db: Session, category_id: UUID) -> Category:
    category = get_category(db, category_id, active_only=False)
    category.is_active = False
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# Products

def _product_query(active_only: bool):
    stmt = select(Product).options(selectinload(Product.category), selectinload(Product.images))
    if active_only:
        stmt = stmt.where(Product.is_active.is_(True), Product.category.has(Category.is_active.is_(True)))
    return stmt.order_by(Product.name.asc())


def list_products(db: Session, *, active_only: bool, category_id: UUID | None = None) -> list[Product]:
    stmt = _product_query(active_only)
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    return list(db.execute(stmt).scalars().all())


def get_product(db: Session, product_id: UUID, *, active_only: bool) -> Product:
    stmt = _product_query(active_only).where(Product.id == product_id)
    product = db.execute(stmt).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


def _validate_category_for_product(db: Session, category_id: UUID) -> Category:
    category = db.execute(select(Category).where(Category.id == category_id)).scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    if not category.is_active:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category is inactive")
    return category


def _replace_product_images(product: Product, images_data) -> None:
    product.images.clear()
    for idx, img in enumerate(images_data):
        product.images.append(
            ProductImage(
                url=img.url.strip(),
                alt_text=img.alt_text,
                is_primary=img.is_primary,
                sort_order=img.sort_order if img.sort_order is not None else idx,
            )
        )


def create_product(db: Session, payload: ProductCreate) -> Product:
    _validate_category_for_product(db, payload.category_id)
    slug = _ensure_product_slug(db, payload.name, payload.slug)

    if payload.price_cop < Decimal("0"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="price_cop must be >= 0")
    if payload.stock_quantity < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="stock_quantity must be >= 0")

    product = Product(
        category_id=payload.category_id,
        name=payload.name.strip(),
        slug=slug,
        description=payload.description,
        price_cop=payload.price_cop.quantize(Decimal("0.01")),
        stock_quantity=payload.stock_quantity,
        is_active=payload.is_active,
    )
    _replace_product_images(product, payload.images)
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product conflict") from exc
    db.refresh(product)
    return get_product(db, product.id, active_only=False)


def update_product(db: Session, product_id: UUID, payload: ProductUpdate) -> Product:
    product = get_product(db, product_id, active_only=False)
    data = payload.model_dump(exclude_unset=True)

    if "category_id" in data and data["category_id"] is not None:
        _validate_category_for_product(db, data["category_id"])

    if "name" in data or "slug" in data:
        name = data.get("name", product.name)
        slug = data.get("slug", product.slug)
        product.slug = _ensure_product_slug(db, name, slug, exclude_id=product.id)

    if "price_cop" in data and data["price_cop"] is not None and data["price_cop"] < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="price_cop must be >= 0")
    if "stock_quantity" in data and data["stock_quantity"] is not None and data["stock_quantity"] < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="stock_quantity must be >= 0")

    images_data = data.pop("images", None)

    for field, value in data.items():
        if field == "slug":
            continue
        if field == "name" and isinstance(value, str):
            value = value.strip()
        if field == "price_cop" and isinstance(value, Decimal):
            value = value.quantize(Decimal("0.01"))
        setattr(product, field, value)

    if images_data is not None:
        _replace_product_images(product, images_data)

    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product conflict") from exc
    db.refresh(product)
    return get_product(db, product.id, active_only=False)


def deactivate_product(db: Session, product_id: UUID) -> Product:
    product = get_product(db, product_id, active_only=False)
    product.is_active = False
    db.add(product)
    db.commit()
    db.refresh(product)
    return get_product(db, product.id, active_only=False)
