from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    AccessTokenResponse,
    AuthTokensResponse,
    ChangePasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    UserRead,
)
from app.modules.auth.service import (
    authenticate_user,
    change_password,
    create_tokens_for_user,
    register_user,
    revoke_refresh_token,
    rotate_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthTokensResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthTokensResponse:
    user = register_user(db, payload)
    access_token, refresh_token = create_tokens_for_user(db, user)
    return AuthTokensResponse(access_token=access_token, refresh_token=refresh_token, user=UserRead.model_validate(user))


@router.post("/login", response_model=AuthTokensResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthTokensResponse:
    user = authenticate_user(db, payload)
    access_token, refresh_token = create_tokens_for_user(db, user)
    return AuthTokensResponse(access_token=access_token, refresh_token=refresh_token, user=UserRead.model_validate(user))


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> AccessTokenResponse:
    _, access_token, refresh_token = rotate_refresh_token(db, payload.refresh_token)
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    change_password(db, current_user, payload)
    return MessageResponse(message="Password changed")


if settings.enable_auth_diagnostics:
    @router.get("/admin-check", response_model=MessageResponse, include_in_schema=False)
    def admin_check(_: User = Depends(require_roles("ADMIN"))) -> MessageResponse:
        return MessageResponse(message="Admin access granted")
