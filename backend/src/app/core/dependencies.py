from collections.abc import Callable

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.modules.auth.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if not token:
        return None
    try:
        payload = decode_token(token)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc

    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    token_ver = payload.get("ver")
    try:
        token_ver_int = int(token_ver)
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(User).filter(User.id == subject).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    if int(getattr(user, "token_version", 1)) != token_ver_int:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return user


def get_current_user(
    current_user: User | None = Depends(get_current_user_optional),
) -> User:
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return current_user


def require_roles(*required_roles: str) -> Callable:
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        # Check roles from DB (current state), not only JWT claims, so role changes take effect immediately.
        user_roles = {role.code for role in current_user.roles}
        if not set(required_roles).intersection(user_roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return dependency


def get_guest_cart_token(x_cart_token: str | None = Header(default=None, alias="X-Cart-Token")) -> str | None:
    if x_cart_token is None:
        return None
    token = x_cart_token.strip()
    if not token:
        return None
    if len(token) < 20 or len(token) > 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cart token")
    return token
