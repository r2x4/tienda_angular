import hashlib
import secrets
from datetime import datetime, timedelta, timezone


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def refresh_token_expiry(days: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)
