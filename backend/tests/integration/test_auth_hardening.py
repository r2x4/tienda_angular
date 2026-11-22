import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import select

from app.core.security import create_access_token, decode_token
from app.modules.auth.models import RefreshToken, User


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
    reg = _register(client, "exp@example.com", "expu")
    with SessionLocal() as db:
        user = db.execute(select(User).where(User.email == "exp@example.com")).scalar_one()
        rt = RefreshToken(
            user_id=user.id,
            token_hash="a" * 64,
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        )
        db.add(rt)
        db.commit()
    # We cannot use raw token for hash a*64; create real one and expire it
    raw_login = _login(client, "exp@example.com", "Pass1234!")
    raw_refresh = raw_login["refresh_token"]
    from app.core.tokens import hash_refresh_token
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
