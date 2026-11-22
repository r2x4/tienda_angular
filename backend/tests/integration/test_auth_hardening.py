import uuid
from datetime import datetime, timedelta, timezone
import threading

from sqlalchemy import select

from app.core.config import settings
from app.core.security import decode_token
from app.core.tokens import hash_refresh_token
from app.modules.auth.models import AuthThrottleCounter, RefreshToken, User


def _register(client, email, username, password="Pass1234!"):
    r = client.post("/auth/register", json={"email": email, "username": username, "password": password})
    assert r.status_code == 201, r.text
    return r.json()


def _login(client, identifier, password):
    r = client.post("/auth/login", json={"identifier": identifier, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


def test_old_access_token_rejected_after_password_change(setup_test_database):
    client, SessionLocal = setup_test_database
    reg = _register(client, "pwdchg@example.com", "pwdchg")
    old_access = reg["access_token"]

    r = client.post(
        "/auth/change-password",
        json={"current_password": "Pass1234!", "new_password": "NewPass1234!"},
        headers={"Authorization": f"Bearer {old_access}"},
    )
    assert r.status_code == 200, r.text

    r = client.get("/auth/me", headers={"Authorization": f"Bearer {old_access}"})
    assert r.status_code == 401

    new_login = _login(client, "pwdchg@example.com", "NewPass1234!")
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {new_login['access_token']}"})
    assert r.status_code == 200


def test_access_token_rejected_after_deactivation(setup_test_database):
    client, SessionLocal = setup_test_database
    admin = _login(client, "admin@example.com", "AdminPass123!")
    user = _register(client, "deact2@example.com", "deact2")
    user_access = user["access_token"]

    r = client.patch(
        f"/admin/users/{user['user']['id']}/deactivate",
        headers={"Authorization": f"Bearer {admin['access_token']}"},
    )
    assert r.status_code == 200

    r = client.get("/auth/me", headers={"Authorization": f"Bearer {user_access}"})
    assert r.status_code == 401

    with SessionLocal() as db:
        tokens = db.execute(select(RefreshToken).where(RefreshToken.user_id == uuid.UUID(user["user"]["id"]))).scalars().all()
        assert tokens
        assert all(t.revoked_at is not None for t in tokens)


def test_refresh_expired_rejected(setup_test_database):
    client, SessionLocal = setup_test_database
    _register(client, "exp@example.com", "expu")
    raw_login = _login(client, "exp@example.com", "Pass1234!")
    raw_refresh = raw_login["refresh_token"]
    with SessionLocal() as db:
        rt = db.execute(select(RefreshToken).where(RefreshToken.token_hash == hash_refresh_token(raw_refresh))).scalar_one()
        rt.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.add(rt)
        db.commit()

    r = client.post("/auth/refresh", json={"refresh_token": raw_refresh})
    assert r.status_code == 401


def test_login_generates_new_valid_tokens(setup_test_database):
    client, _ = setup_test_database
    _register(client, "newlogin@example.com", "newlogin")
    login = _login(client, "newlogin@example.com", "Pass1234!")
    payload = decode_token(login["access_token"])
    assert payload["type"] == "access"
    assert "ver" in payload
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {login['access_token']}"})
    assert r.status_code == 200


def test_change_password_rejects_wrong_current_password(setup_test_database):
    client, _ = setup_test_database
    reg = _register(client, "wrongpw@example.com", "wrongpw")
    r = client.post(
        "/auth/change-password",
        json={"current_password": "BadPass123!", "new_password": "NewPass1234!"},
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert r.status_code == 400


def test_change_password_rejects_reused_password(setup_test_database):
    client, _ = setup_test_database
    reg = _register(client, "reusepw@example.com", "reusepw")
    r = client.post(
        "/auth/change-password",
        json={"current_password": "Pass1234!", "new_password": "Pass1234!"},
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert r.status_code == 400


def test_login_with_new_password_succeeds_and_old_fails(setup_test_database):
    client, _ = setup_test_database
    reg = _register(client, "pwok@example.com", "pwok")
    r = client.post(
        "/auth/change-password",
        json={"current_password": "Pass1234!", "new_password": "NewPass1234!"},
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert r.status_code == 200
    assert _login(client, "pwok@example.com", "NewPass1234!")["access_token"]
    r = client.post("/auth/login", json={"identifier": "pwok@example.com", "password": "Pass1234!"})
    assert r.status_code == 401


def test_refresh_token_is_atomic_single_use(setup_test_database):
    client, SessionLocal = setup_test_database
    reg = _register(client, "atomic@example.com", "atomicu")
    raw_refresh = reg["refresh_token"]
    results: list[tuple[int, str | None]] = []
    barrier = threading.Barrier(2)

    def do_refresh():
        with SessionLocal() as db:
            from app.modules.auth.service import rotate_refresh_token
            try:
                barrier.wait(timeout=10)
                _, access, new_refresh = rotate_refresh_token(db, raw_refresh)
                db.commit()
                results.append((200, new_refresh))
            except Exception as exc:
                db.rollback()
                status = getattr(exc, "status_code", 500)
                results.append((int(status), None))

    t1 = threading.Thread(target=do_refresh)
    t2 = threading.Thread(target=do_refresh)
    t1.start(); t2.start(); t1.join(timeout=30); t2.join(timeout=30)

    assert len(results) == 2
    codes = sorted([r[0] for r in results])
    assert codes == [200, 401], results
    issued = [r[1] for r in results if r[0] == 200 and r[1]]
    assert len(issued) == 1
    with SessionLocal() as db:
        rows = db.execute(select(RefreshToken).where(RefreshToken.user_id == uuid.UUID(reg["user"]["id"]))).scalars().all()
        revoked = [r for r in rows if r.revoked_at is not None]
        active = [r for r in rows if r.revoked_at is None]
        assert len(revoked) >= 1
        assert len(active) == 1


def test_rate_limit_login_returns_429(setup_test_database, monkeypatch):
    client, _ = setup_test_database
    monkeypatch.setattr(settings, "auth_rate_limit_login_limit", 2)
    monkeypatch.setattr(settings, "auth_rate_limit_login_window_seconds", 60)
    monkeypatch.setattr(settings, "auth_rate_limit_login_block_seconds", 60)
    _register(client, "rl@example.com", "rlu")
    for _ in range(2):
        r = client.post("/auth/login", json={"identifier": "rl@example.com", "password": "WrongPass123!"})
        assert r.status_code == 401
    r = client.post("/auth/login", json={"identifier": "rl@example.com", "password": "WrongPass123!"})
    assert r.status_code == 429


def test_rate_limit_register_returns_429(setup_test_database, monkeypatch):
    client, _ = setup_test_database
    monkeypatch.setattr(settings, "auth_rate_limit_register_limit", 2)
    monkeypatch.setattr(settings, "auth_rate_limit_register_window_seconds", 60)
    monkeypatch.setattr(settings, "auth_rate_limit_register_block_seconds", 60)
    payload = {"email": "rlr@example.com", "username": "rlr", "password": "Pass1234!"}
    r1 = client.post("/auth/register", json=payload)
    assert r1.status_code == 201
    r2 = client.post("/auth/register", json={**payload, "username": "rlr2"})
    assert r2.status_code in (409, 429)  # 2nd allowed by limiter, may conflict on duplicate
    r3 = client.post("/auth/register", json={**payload, "username": "rlr3"})
    assert r3.status_code == 429


def test_rate_limit_refresh_returns_429(setup_test_database, monkeypatch):
    client, _ = setup_test_database
    monkeypatch.setattr(settings, "auth_rate_limit_refresh_limit", 2)
    monkeypatch.setattr(settings, "auth_rate_limit_refresh_window_seconds", 60)
    monkeypatch.setattr(settings, "auth_rate_limit_refresh_block_seconds", 60)
    reg = _register(client, "rlrf@example.com", "rlrf")
    for _ in range(2):
        r = client.post("/auth/refresh", json={"refresh_token": "invalid-refresh-token-value-123456"})
        assert r.status_code == 401
    r = client.post("/auth/refresh", json={"refresh_token": "invalid-refresh-token-value-123456"})
    assert r.status_code == 429


def test_auth_throttle_counter_persisted(setup_test_database):
    client, SessionLocal = setup_test_database
    _register(client, "persist@example.com", "persistu")
    client.post("/auth/login", json={"identifier": "persist@example.com", "password": "WrongPass123!"})
    with SessionLocal() as db:
        rows = db.execute(select(AuthThrottleCounter).where(AuthThrottleCounter.scope == "login")).scalars().all()
        assert len(rows) >= 1
        assert any(r.count >= 1 for r in rows)
