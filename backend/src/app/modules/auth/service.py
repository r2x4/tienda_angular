from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.core.tokens import generate_refresh_token, hash_refresh_token, refresh_token_expiry
from app.modules.auth.models import RefreshToken, Role, User, UserRole
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


# -------------------------
# Admin user/role management
# -------------------------


def _normalize_role_codes(role_codes: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for code in role_codes:
        c = code.strip().upper()
        if not c:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Role code cannot be empty")
        if c not in seen:
            seen.add(c)
            normalized.append(c)
    if not normalized:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="At least one role is required")
    return normalized


def _lock_admin_role(db: Session) -> Role:
    admin_role = db.execute(select(Role).where(Role.code == ROLE_ADMIN).with_for_update()).scalar_one_or_none()
    if not admin_role:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="ADMIN role not configured")
    return admin_role


def _count_active_admins(db: Session, admin_role_id: UUID) -> int:
    stmt = (
        select(func.count(func.distinct(User.id)))
        .select_from(User)
        .join(UserRole, UserRole.user_id == User.id)
        .where(UserRole.role_id == admin_role_id, User.is_active.is_(True))
    )
    return int(db.execute(stmt).scalar_one())


def _get_user_for_admin(db: Session, user_id: UUID, *, for_update: bool = False) -> User:
    stmt = select(User).options(selectinload(User.roles)).where(User.id == user_id)
    if for_update:
        stmt = stmt.with_for_update()
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def _revalidate_actor(db: Session, actor_user_id: UUID) -> User:
    actor = db.execute(
        select(User).options(selectinload(User.roles)).where(User.id == actor_user_id).with_for_update()
    ).scalar_one_or_none()
    if not actor or not actor.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Actor is not active")
    if ROLE_ADMIN not in {r.code for r in actor.roles}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Actor is not an active administrator")
    return actor


def list_admin_users(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 20,
    is_active: bool | None = None,
    role: str | None = None,
    q: str | None = None,
) -> tuple[list[User], int]:
    skip = max(0, skip)
    limit = min(max(1, limit), 100)

    stmt = select(User).options(selectinload(User.roles))
    count_stmt = select(func.count(func.distinct(User.id))).select_from(User)

    if is_active is not None:
        stmt = stmt.where(User.is_active.is_(is_active))
        count_stmt = count_stmt.where(User.is_active.is_(is_active))

    if role:
        role_code = role.strip().upper()
        stmt = stmt.join(UserRole, UserRole.user_id == User.id).join(Role, Role.id == UserRole.role_id).where(Role.code == role_code)
        count_stmt = count_stmt.join(UserRole, UserRole.user_id == User.id).join(Role, Role.id == UserRole.role_id).where(Role.code == role_code)

    if q:
        term = f"%{q.strip().lower()}%"
        search_filter = or_(
            func.lower(User.email).like(term),
            func.lower(func.coalesce(User.username, "")).like(term),
            func.lower(func.coalesce(User.first_name, "")).like(term),
            func.lower(func.coalesce(User.last_name, "")).like(term),
        )
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    stmt = stmt.order_by(User.created_at.desc(), User.id.desc()).offset(skip).limit(limit)
    items = list(db.execute(stmt).scalars().unique().all())
    total = int(db.execute(count_stmt).scalar_one())
    return items, total


def get_admin_user(db: Session, user_id: UUID) -> User:
    return _get_user_for_admin(db, user_id, for_update=False)


def list_roles(db: Session) -> list[Role]:
    return list(db.execute(select(Role).order_by(Role.code.asc())).scalars().all())


def activate_user(db: Session, *, actor_user_id: UUID, user_id: UUID) -> User:
    try:
        with db.begin_nested() if db.in_transaction() else db.begin():
            _revalidate_actor(db, actor_user_id)
            user = _get_user_for_admin(db, user_id, for_update=True)
            if not user.is_active:
                user.is_active = True
                db.add(user)
            db.flush()
            result = _get_user_for_admin(db, user_id, for_update=False)
        db.commit()
        return result
    except Exception:
        db.rollback()
        raise


def deactivate_user(db: Session, *, actor_user_id: UUID, user_id: UUID) -> User:
    try:
        with db.begin_nested() if db.in_transaction() else db.begin():
            _revalidate_actor(db, actor_user_id)
            if actor_user_id == user_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot deactivate your own account")

            user = _get_user_for_admin(db, user_id, for_update=True)
            if user.is_active:
                user_codes = {r.code for r in user.roles}
                if ROLE_ADMIN in user_codes:
                    admin_role = _lock_admin_role(db)
                    active_admins = _count_active_admins(db, admin_role.id)
                    if active_admins <= 1:
                        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot deactivate the last active administrator")

                user.is_active = False
                db.add(user)

                now = datetime.now(timezone.utc)
                active_tokens = db.execute(
                    select(RefreshToken).where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None)).with_for_update()
                ).scalars().all()
                for token in active_tokens:
                    token.revoked_at = now
                    db.add(token)

            db.flush()
            result = _get_user_for_admin(db, user_id, for_update=False)
        db.commit()
        return result
    except Exception:
        db.rollback()
        raise


def replace_user_roles(db: Session, *, actor_user_id: UUID, user_id: UUID, role_codes: list[str]) -> User:
    normalized_codes = _normalize_role_codes(role_codes)
    try:
        with db.begin_nested() if db.in_transaction() else db.begin():
            _revalidate_actor(db, actor_user_id)
            target = _get_user_for_admin(db, user_id, for_update=True)

            roles = list(db.execute(select(Role).where(Role.code.in_(normalized_codes))).scalars().all())
            roles_by_code = {r.code: r for r in roles}
            missing = [code for code in normalized_codes if code not in roles_by_code]
            if missing:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Unknown role codes: {', '.join(missing)}")

            current_codes = {r.code for r in target.roles}
            requested_codes = set(normalized_codes)

            if actor_user_id == user_id and ROLE_ADMIN in current_codes and ROLE_ADMIN not in requested_codes:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot remove your own ADMIN role")

            if target.is_active and ROLE_ADMIN in current_codes and ROLE_ADMIN not in requested_codes:
                admin_role = _lock_admin_role(db)
                active_admins = _count_active_admins(db, admin_role.id)
                if active_admins <= 1:
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot remove ADMIN role from the last active administrator")

            # Replace associations atomically in-transaction
            target.roles = [roles_by_code[code] for code in normalized_codes]
            db.add(target)
            db.flush()
            result = _get_user_for_admin(db, user_id, for_update=False)
        db.commit()
        return result
    except Exception:
        db.rollback()
        raise
