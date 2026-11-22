import uuid

import pytest
from sqlalchemy import select

from app.modules.auth.models import RefreshToken, User


def _register(client, email, username, password="Pass1234!"):
    r = client.post("/auth/register", json={"email": email, "username": username, "password": password})
    assert r.status_code == 201, r.text
    return r.json()


def _login(client, identifier, password):
    r = client.post("/auth/login", json={"identifier": identifier, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


def _admin_headers(client):
    data = _login(client, "admin@example.com", "AdminPass123!")
    return {"Authorization": f"Bearer {data['access_token']}"}


def _customer_headers(client, suffix=None):
    suffix = suffix or uuid.uuid4().hex[:6]
    email = f"cust-{suffix}@example.com"
    username = f"cust_{suffix}"
    data = _register(client, email, username)
    return {"Authorization": f"Bearer {data['access_token']}"}, data["user"]


def _fresh_session(SessionLocal):
    return SessionLocal()


def test_admin_users_routes_registered_and_rbac(setup_test_database):
    client, _ = setup_test_database

    # unauthenticated
    assert client.get("/admin/users").status_code == 401
    assert client.get("/admin/roles").status_code == 401

    # customer forbidden
    cust_headers, _ = _customer_headers(client)
    assert client.get("/admin/users", headers=cust_headers).status_code == 403
    assert client.get("/admin/roles", headers=cust_headers).status_code == 403

    # admin allowed
    admin = _admin_headers(client)
    r = client.get("/admin/users", headers=admin)
    assert r.status_code == 200
    body = r.json()
    assert set(body.keys()) >= {"items", "total", "skip", "limit"}

    r = client.get("/admin/roles", headers=admin)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_admin_get_endpoints_do_not_commit_outer_transaction(setup_test_database, monkeypatch):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    import app.modules.auth.router as auth_router

    commit_calls = {"count": 0}
    real_commit = auth_router.commit_admin_db

    def spy_commit(db):
        commit_calls["count"] += 1
        return real_commit(db)

    monkeypatch.setattr(auth_router, "commit_admin_db", spy_commit)

    r = client.get("/admin/users", headers=admin)
    assert r.status_code == 200
    r = client.get("/admin/roles", headers=admin)
    assert r.status_code == 200
    # no write endpoint called; GETs must not call commit_admin_db
    assert commit_calls["count"] == 0


def test_admin_users_list_filters_pagination_and_schema(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    _, u1 = _customer_headers(client, "alice1")

    r = client.get("/admin/users", params={"q": "alice1", "limit": 5, "skip": 0}, headers=admin)
    assert r.status_code == 200
    body = r.json()
    assert body["limit"] == 5
    assert body["skip"] == 0
    assert any(i["email"] == u1["email"] for i in body["items"])

    r = client.get("/admin/users", params={"role": "CUSTOMER"}, headers=admin)
    assert r.status_code == 200
    assert all(any(role["code"] == "CUSTOMER" for role in i["roles"]) for i in r.json()["items"])

    first = r.json()["items"][0]
    assert "password_hash" not in first
    assert "refresh_tokens" not in first


def test_admin_get_user_existing_and_404(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    _, user = _customer_headers(client)

    r = client.get(f"/admin/users/{user['id']}", headers=admin)
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == user["id"]
    assert "password_hash" not in body

    missing = uuid.uuid4()
    r = client.get(f"/admin/users/{missing}", headers=admin)
    assert r.status_code == 404


def test_admin_activate_persists_in_independent_session(setup_test_database):
    client, SessionLocal = setup_test_database
    admin = _admin_headers(client)
    _, user = _customer_headers(client)

    r = client.patch(f"/admin/users/{user['id']}/deactivate", headers=admin)
    assert r.status_code == 200

    r = client.patch(f"/admin/users/{user['id']}/activate", headers=admin)
    assert r.status_code == 200
    assert r.json()["is_active"] is True

    with _fresh_session(SessionLocal) as check:
        persisted = check.execute(select(User).where(User.id == uuid.UUID(user["id"]))).scalar_one()
        assert persisted.is_active is True


def test_admin_deactivate_persists_and_revokes_refresh_tokens(setup_test_database):
    client, SessionLocal = setup_test_database
    admin = _admin_headers(client)
    _, user = _customer_headers(client)
    login_data = _login(client, user["email"], "Pass1234!")
    refresh_token = login_data["refresh_token"]

    r = client.patch(f"/admin/users/{user['id']}/deactivate", headers=admin)
    assert r.status_code == 200
    assert r.json()["is_active"] is False

    with _fresh_session(SessionLocal) as check:
        persisted = check.execute(select(User).where(User.id == uuid.UUID(user["id"]))).scalar_one()
        assert persisted.is_active is False
        tokens = check.execute(select(RefreshToken).where(RefreshToken.user_id == persisted.id)).scalars().all()
        assert tokens
        assert all(t.revoked_at is not None for t in tokens)

    r = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code in (401, 403)


def test_admin_replace_roles_persists_in_independent_session(setup_test_database):
    client, SessionLocal = setup_test_database
    admin = _admin_headers(client)
    _, user = _customer_headers(client)

    r = client.put(f"/admin/users/{user['id']}/roles", headers=admin, json={"roles": ["admin", "customer"]})
    assert r.status_code == 200
    assert {role["code"] for role in r.json()["roles"]} == {"ADMIN", "CUSTOMER"}

    with _fresh_session(SessionLocal) as check:
        persisted = check.execute(select(User).where(User.id == uuid.UUID(user["id"]))).scalar_one()
        assert {role.code for role in persisted.roles} == {"ADMIN", "CUSTOMER"}


def test_admin_error_does_not_leave_partial_changes(setup_test_database):
    client, SessionLocal = setup_test_database
    admin = _admin_headers(client)
    _, user = _customer_headers(client)

    with _fresh_session(SessionLocal) as check:
        before = check.execute(select(User).where(User.id == uuid.UUID(user["id"]))).scalar_one()
        before_active = before.is_active
        before_roles = sorted(r.code for r in before.roles)

    r = client.put(f"/admin/users/{user['id']}/roles", headers=admin, json={"roles": ["UNKNOWN"]})
    assert r.status_code == 422

    with _fresh_session(SessionLocal) as check:
        after = check.execute(select(User).where(User.id == uuid.UUID(user["id"]))).scalar_one()
        assert after.is_active == before_active
        assert sorted(r.code for r in after.roles) == before_roles

    me = client.get("/auth/me", headers=admin).json()
    r = client.patch(f"/admin/users/{me['id']}/deactivate", headers=admin)
    assert r.status_code == 403
    with _fresh_session(SessionLocal) as check:
        admin_db = check.execute(select(User).where(User.id == uuid.UUID(me["id"]))).scalar_one()
        assert admin_db.is_active is True


def test_admin_commit_failure_does_not_return_success(setup_test_database, monkeypatch):
    client, SessionLocal = setup_test_database
    admin = _admin_headers(client)
    _, user = _customer_headers(client)

    import app.modules.auth.router as auth_router

    def fail_commit(db):
        raise RuntimeError("simulated commit failure")

    monkeypatch.setattr(auth_router, "commit_admin_db", fail_commit)

    with pytest.raises(RuntimeError, match="simulated commit failure"):
        client.patch(f"/admin/users/{user['id']}/deactivate", headers=admin)

    with _fresh_session(SessionLocal) as check:
        persisted = check.execute(select(User).where(User.id == uuid.UUID(user["id"]))).scalar_one()
        assert persisted.is_active is True


def test_admin_replace_roles_commit_failure_does_not_persist(setup_test_database, monkeypatch):
    client, SessionLocal = setup_test_database
    admin = _admin_headers(client)
    _, user = _customer_headers(client)

    import app.modules.auth.router as auth_router

    def fail_commit(db):
        raise RuntimeError("simulated commit failure")

    monkeypatch.setattr(auth_router, "commit_admin_db", fail_commit)

    with pytest.raises(RuntimeError, match="simulated commit failure"):
        client.put(f"/admin/users/{user['id']}/roles", headers=admin, json={"roles": ["admin", "customer"]})

    with _fresh_session(SessionLocal) as check:
        persisted = check.execute(select(User).where(User.id == uuid.UUID(user["id"]))).scalar_one()
        assert {r.code for r in persisted.roles} == {"CUSTOMER"}


def test_admin_replace_roles_and_validation(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    _, user = _customer_headers(client)

    r = client.put(f"/admin/users/{user['id']}/roles", headers=admin, json={"roles": ["admin", "customer"]})
    assert r.status_code == 200
    assert {role["code"] for role in r.json()["roles"]} == {"ADMIN", "CUSTOMER"}

    r = client.put(f"/admin/users/{user['id']}/roles", headers=admin, json={"roles": ["UNKNOWN"]})
    assert r.status_code == 422

    r = client.put(f"/admin/users/{user['id']}/roles", headers=admin, json={"roles": []})
    assert r.status_code == 422


def test_admin_replace_roles_business_conflicts(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    me = client.get("/auth/me", headers=admin).json()

    r = client.put(f"/admin/users/{me['id']}/roles", headers=admin, json={"roles": ["CUSTOMER"]})
    assert r.status_code == 403

    _, other = _customer_headers(client, "otheradmin")
    r = client.put(f"/admin/users/{other['id']}/roles", headers=admin, json={"roles": ["ADMIN"]})
    assert r.status_code == 200
    r = client.put(f"/admin/users/{other['id']}/roles", headers=admin, json={"roles": ["CUSTOMER"]})
    assert r.status_code == 200
