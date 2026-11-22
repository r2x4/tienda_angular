import hashlib
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings


@dataclass
class RateLimitRule:
    scope: str
    limit: int
    window_seconds: int
    block_seconds: int


def _hash_key(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()[:64]
    if request.client and request.client.host:
        return request.client.host[:64]
    return "unknown"


class AuthRateLimiter:
    """PostgreSQL-backed fixed-window limiter for multi-process safety without Redis."""

    def _rule(self, scope: str) -> RateLimitRule:
        if scope == "login":
            return RateLimitRule(scope, settings.auth_rate_limit_login_limit, settings.auth_rate_limit_login_window_seconds, settings.auth_rate_limit_login_block_seconds)
        if scope == "register":
            return RateLimitRule(scope, settings.auth_rate_limit_register_limit, settings.auth_rate_limit_register_window_seconds, settings.auth_rate_limit_register_block_seconds)
        if scope == "refresh":
            return RateLimitRule(scope, settings.auth_rate_limit_refresh_limit, settings.auth_rate_limit_refresh_window_seconds, settings.auth_rate_limit_refresh_block_seconds)
        raise ValueError(f"Unknown rate limit scope: {scope}")

    def enforce(self, db: Session, request: Request, scope: str, identifier: str | None = None) -> None:
        from app.modules.auth.models import AuthThrottleCounter

        rule = self._rule(scope)
        now = datetime.now(timezone.utc)
        ip = _client_ip(request)
        key_raw = f"{scope}:{ip}:{(identifier or '').strip().lower()}"
        key_hash = _hash_key(key_raw)

        cutoff = now - timedelta(seconds=max(rule.window_seconds, rule.block_seconds) * 2)
        db.execute(delete(AuthThrottleCounter).where(AuthThrottleCounter.updated_at < cutoff))

        row = db.execute(
            select(AuthThrottleCounter)
            .where(AuthThrottleCounter.key_hash == key_hash, AuthThrottleCounter.scope == scope)
            .with_for_update()
        ).scalar_one_or_none()

        if row and row.blocked_until and row.blocked_until > now:
            db.commit()
            try:
                from app.core.security_audit import log_security_event
                log_security_event("auth.rate_limit.blocked", outcome="blocked", ip=ip, details={"scope": scope})
            except Exception:
                pass
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests. Try again later.")

        window_start = now.replace(microsecond=0)
        if not row or (now - row.window_start).total_seconds() >= rule.window_seconds:
            if row is None:
                row = AuthThrottleCounter(key_hash=key_hash, scope=scope, window_start=window_start, count=1, updated_at=now)
                db.add(row)
            else:
                row.window_start = window_start
                row.count = 1
                row.blocked_until = None
                row.updated_at = now
                db.add(row)
            db.commit()
            return

        row.count = int(row.count) + 1
        row.updated_at = now
        if row.count > rule.limit:
            row.blocked_until = now + timedelta(seconds=rule.block_seconds)
            db.add(row)
            db.commit()
            try:
                from app.core.security_audit import log_security_event
                log_security_event("auth.rate_limit.blocked", outcome="blocked", ip=ip, details={"scope": scope})
            except Exception:
                pass
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests. Try again later.")

        db.add(row)
        db.commit()


rate_limiter = AuthRateLimiter()
