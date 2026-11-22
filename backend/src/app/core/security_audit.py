import logging
from typing import Any

logger = logging.getLogger("app.security.audit")

SENSITIVE_KEYS = {"password", "token", "refresh_token", "access_token", "authorization", "secret", "jwt"}


def _sanitize(details: dict[str, Any] | None) -> dict[str, Any]:
    clean: dict[str, Any] = {}
    for k, v in (details or {}).items():
        if any(s in k.lower() for s in SENSITIVE_KEYS):
            continue
        clean[k] = v
    return clean


def log_security_event(event_type: str, *, outcome: str, ip: str | None = None, user_id: str | None = None, details: dict[str, Any] | None = None) -> None:
    payload = {
        "event_type": event_type,
        "outcome": outcome,
        "ip": ip or "unknown",
        "user_id": user_id,
        **_sanitize(details),
    }
    logger.info("security_event %s", payload)
