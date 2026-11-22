from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from collections.abc import Generator


def get_admin_db(db: Session = Depends(get_db)) -> Generator[Session, None, None]:
    """Request-scoped DB dependency for admin endpoints.

    F6.3 services use SAVEPOINTs when a transaction is already active; dependencies like
    require_roles may trigger SQLAlchemy autobegin. This dependency does NOT commit after
    yield (FastAPI runs post-yield after response is sent). Write endpoints must call
    commit_admin_db() before returning a successful response. Rollback is preserved on
    exceptions to avoid leaking partial outer-transaction state.
    """
    try:
        yield db
    except Exception:
        if db.in_transaction():
            db.rollback()
        raise


def commit_admin_db(db: Session) -> None:
    """Commit the outer request transaction before sending a successful response."""
    if db.in_transaction():
        db.commit()
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    AccessTokenResponse,
    AdminUserListResponse,
    AdminUserRead,
    AdminUserRolesReplaceRequest,
    AuthTokensResponse,
    ChangePasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    RoleRead,
    UserRead,
)
from app.modules.auth.service import (
    activate_user,
    authenticate_user,
    change_password,
    create_tokens_for_user,
    deactivate_user,
    get_admin_user,
    list_admin_users,
    list_roles,
    register_user,
    replace_user_roles,
    revoke_refresh_token,
    rotate_refresh_token,
)
from app.modules.auth.rate_limit import rate_limiter
from app.core.security_audit import log_security_event

router = APIRouter(prefix="/auth", tags=["auth"])
admin_users_router = APIRouter(prefix="/admin", tags=["admin-users"], dependencies=[Depends(require_roles("ADMIN"))])


@router.post("/register", response_model=AuthTokensResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)) -> AuthTokensResponse:
    ip = request.client.host if request.client else "unknown"
    rate_limiter.enforce(db, request, "register", payload.email)
    user = register_user(db, payload)
    access_token, refresh_token = create_tokens_for_user(db, user)
    log_security_event("auth.register", outcome="success", ip=ip, user_id=str(user.id))
    return AuthTokensResponse(access_token=access_token, refresh_token=refresh_token, user=UserRead.model_validate(user))


@router.post("/login", response_model=AuthTokensResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> AuthTokensResponse:
    ip = request.client.host if request.client else "unknown"
    rate_limiter.enforce(db, request, "login", payload.identifier)
    try:
        user = authenticate_user(db, payload)
    except Exception:
        log_security_event("auth.login", outcome="failure", ip=ip, details={"identifier": payload.identifier[:64]})
        raise
    access_token, refresh_token = create_tokens_for_user(db, user)
    log_security_event("auth.login", outcome="success", ip=ip, user_id=str(user.id))
    return AuthTokensResponse(access_token=access_token, refresh_token=refresh_token, user=UserRead.model_validate(user))


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)) -> AccessTokenResponse:
    ip = request.client.host if request.client else "unknown"
    rate_limiter.enforce(db, request, "refresh")
    try:
        _, access_token, refresh_token = rotate_refresh_token(db, payload.refresh_token)
    except Exception:
        if db.in_transaction():
            db.rollback()
        log_security_event("auth.refresh", outcome="failure", ip=ip)
        raise
    if db.in_transaction():
        db.commit()
    log_security_event("auth.refresh", outcome="success", ip=ip)
    return AccessTokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout", response_model=MessageResponse)
def logout(payload: LogoutRequest, db: Session = Depends(get_db)) -> MessageResponse:
    revoke_refresh_token(db, payload.refresh_token)
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.post("/change-password", response_model=MessageResponse)
def change_password_endpoint(
    payload: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    try:
        change_password(db, current_user, payload)
    except Exception:
        if db.in_transaction():
            db.rollback()
        raise
    if db.in_transaction():
        db.commit()
    ip = request.client.host if request.client else "unknown"
    log_security_event("auth.change_password", outcome="success", ip=ip, user_id=str(current_user.id))
    return MessageResponse(message="Password changed")


if settings.enable_auth_diagnostics:
    @router.get("/admin-check", response_model=MessageResponse, include_in_schema=False)
    def admin_check(_: User = Depends(require_roles("ADMIN"))) -> MessageResponse:
        return MessageResponse(message="Admin access granted")

# -------------------------
# Admin users / roles
# -------------------------


@admin_users_router.get('/users', response_model=AdminUserListResponse)
def admin_list_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    is_active: bool | None = Query(default=None),
    role: str | None = Query(default=None),
    q: str | None = Query(default=None),
    db: Session = Depends(get_admin_db),
    _: User = Depends(require_roles('ADMIN')),
) -> AdminUserListResponse:
    items, total = list_admin_users(db, skip=skip, limit=limit, is_active=is_active, role=role, q=q)
    return AdminUserListResponse(
        items=[AdminUserRead.model_validate(u) for u in items],
        total=total,
        skip=skip,
        limit=min(max(1, limit), 100),
    )


@admin_users_router.get('/users/{user_id}', response_model=AdminUserRead)
def admin_get_user(
    user_id: UUID,
    db: Session = Depends(get_admin_db),
    _: User = Depends(require_roles('ADMIN')),
) -> AdminUserRead:
    return AdminUserRead.model_validate(get_admin_user(db, user_id))


@admin_users_router.patch('/users/{user_id}/activate', response_model=AdminUserRead)
def admin_activate_user(
    user_id: UUID,
    db: Session = Depends(get_admin_db),
    current_user: User = Depends(require_roles('ADMIN')),
) -> AdminUserRead:
    result = AdminUserRead.model_validate(activate_user(db, actor_user_id=current_user.id, user_id=user_id))
    commit_admin_db(db)
    return result


@admin_users_router.patch('/users/{user_id}/deactivate', response_model=AdminUserRead)
def admin_deactivate_user(
    user_id: UUID,
    db: Session = Depends(get_admin_db),
    current_user: User = Depends(require_roles('ADMIN')),
) -> AdminUserRead:
    result = AdminUserRead.model_validate(deactivate_user(db, actor_user_id=current_user.id, user_id=user_id))
    commit_admin_db(db)
    ip = "admin"
    log_security_event("admin.user.deactivate", outcome="success", user_id=str(user_id), details={"actor_id": str(current_user.id)})
    return result


@admin_users_router.get('/roles', response_model=list[RoleRead])
def admin_list_roles(
    db: Session = Depends(get_admin_db),
    _: User = Depends(require_roles('ADMIN')),
) -> list[RoleRead]:
    return [RoleRead.model_validate(r) for r in list_roles(db)]


@admin_users_router.put('/users/{user_id}/roles', response_model=AdminUserRead)
def admin_replace_user_roles(
    user_id: UUID,
    payload: AdminUserRolesReplaceRequest,
    db: Session = Depends(get_admin_db),
    current_user: User = Depends(require_roles('ADMIN')),
) -> AdminUserRead:
    result = AdminUserRead.model_validate(
        replace_user_roles(db, actor_user_id=current_user.id, user_id=user_id, role_codes=payload.roles)
    )
    commit_admin_db(db)
    log_security_event("admin.user.roles.replace", outcome="success", user_id=str(user_id), details={"actor_id": str(current_user.id), "roles": payload.roles})
    return result

