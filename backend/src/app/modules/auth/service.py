from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.core.tokens import generate_refresh_token, hash_refresh_token, refresh_token_expiry
from app.modules.auth.models import RefreshToken, Role, User
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
)


ROLE_ADMIN = "ADMIN"
ROLE_CUSTOMER = "CUSTOMER"


def ensure_default_roles(db: Session) -> None:
    existing = {r.code for r in db.execute(select(Role)).scalars().all()}
    for code, name in [(ROLE_ADMIN, "Administrator"), (ROLE_CUSTOMER, "Customer")]:
        if code not in existing:
            db.add(Role(code=code, name=name))
    db.commit()


def get_user_by_identifier(db: Session, identifier: str) -> User | None:
    stmt = select(User).where(or_(User.email == identifier.lower(), User.username == identifier))
    return db.execute(stmt).scalar_one_or_none()


def get_user_roles(user: User) -> list[str]:
    return [role.code for role in user.roles]


def create_tokens_for_user(db: Session, user: User) -> tuple[str, str]:
    roles = get_user_roles(user)
    access_token = create_access_token(subject=str(user.id), roles=roles)
    raw_refresh = generate_refresh_token()
    rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(raw_refresh),
        expires_at=refresh_token_expiry(settings.refresh_token_expire_days),
    )
    db.add(rt)
    db.commit()
    return access_token, raw_refresh


def register_user(db: Session, payload: RegisterRequest) -> User:
    ensure_default_roles(db)

    email = payload.email.lower()
    existing = db.execute(
        select(User).where(or_(User.email == email, User.username == payload.username))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    customer_role = db.execute(select(Role).where(Role.code == ROLE_CUSTOMER)).scalar_one()
    user = User(
        email=email,
        username=payload.username,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        city=payload.city,
        is_active=True,
    )
    user.roles.append(customer_role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, payload: LoginRequest) -> User:
    user = get_user_by_identifier(db, payload.identifier)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user


def rotate_refresh_token(db: Session, raw_refresh_token: str) -> tuple[User, str, str]:
    token_hash = hash_refresh_token(raw_refresh_token)
    token = db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash)).scalar_one_or_none()
    if not token or token.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    if token.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expired refresh token")

    user = db.execute(select(User).where(User.id == token.user_id)).scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    token.revoked_at = datetime.now(timezone.utc)
    db.add(token)
    db.commit()

    access_token, new_refresh = create_tokens_for_user(db, user)
    return user, access_token, new_refresh


def revoke_refresh_token(db: Session, raw_refresh_token: str) -> None:
    token_hash = hash_refresh_token(raw_refresh_token)
    token = db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash)).scalar_one_or_none()
    if not token:
        return
    if token.revoked_at is None:
        token.revoked_at = datetime.now(timezone.utc)
        db.add(token)
        db.commit()


def change_password(db: Session, user: User, payload: ChangePasswordRequest) -> None:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be different")

    user.password_hash = hash_password(payload.new_password)
    db.add(user)

    active_tokens = db.execute(
        select(RefreshToken).where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
    ).scalars().all()
    for token in active_tokens:
        token.revoked_at = datetime.now(timezone.utc)
        db.add(token)

    db.commit()
