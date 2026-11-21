import asyncio

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.dependencies import require_roles
from app.modules.auth.models import Role, User


def _register(client: TestClient, email: str, username: str, password: str = "Passw0rd123!"):
    return client.post(
        "/auth/register",
        json={"email": email, "username": username, "password": password},
    )


def test_refresh_reuse_is_rejected(setup_test_database):
    client, _ = setup_test_database
    r = _register(client, "reuse@example.com", "reuse1")
    assert r.status_code == 201
    refresh = r.json()["refresh_token"]

    r1 = client.post("/auth/refresh", json={"refresh_token": refresh})
    assert r1.status_code == 200
    r2 = client.post("/auth/refresh", json={"refresh_token": refresh})
    assert r2.status_code == 401


def test_deactivated_user_cannot_login_refresh_or_access_me(setup_test_database):
    client, SessionLocal = setup_test_database
    r = _register(client, "deact@example.com", "deact1")
    assert r.status_code == 201
    tokens = r.json()
    access = tokens["access_token"]
    refresh = tokens["refresh_token"]

    with SessionLocal() as db:
        user = db.execute(select(User).where(User.email == "deact@example.com")).scalar_one()
        user.is_active = False
        db.add(user)
        db.commit()

    r = client.post("/auth/login", json={"identifier": "deact@example.com", "password": "Passw0rd123!"})
    assert r.status_code in (401, 403)

    r = client.post("/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 401

    r = client.get("/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert r.status_code == 401


def test_role_change_takes_effect_immediately_for_db_checked_roles(setup_test_database):
    client, SessionLocal = setup_test_database
    r = _register(client, "rolechg@example.com", "rolechg1")
    assert r.status_code == 201

    dependency = require_roles("ADMIN")

    with SessionLocal() as db:
        user = db.execute(select(User).where(User.email == "rolechg@example.com")).scalar_one()
        with pytest.raises(HTTPException) as exc:
            asyncio.run(dependency(current_user=user))
        assert exc.value.status_code == 403

        admin_role = db.execute(select(Role).where(Role.code == "ADMIN")).scalar_one()
        user.roles.append(admin_role)
        db.add(user)
        db.commit()
        db.refresh(user)

        resolved = dependency(current_user=user)
        if asyncio.iscoroutine(resolved):
            resolved = asyncio.run(resolved)
        assert resolved.id == user.id
