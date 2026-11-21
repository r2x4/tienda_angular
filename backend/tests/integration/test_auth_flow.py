from fastapi.testclient import TestClient


def register_payload(email="user1@test.local", username="user1", password="Passw0rd123!"):
    return {
        "email": email,
        "username": username,
        "password": password,
        "first_name": "Test",
        "last_name": "User",
        "phone": "123456789",
        "city": "Bogota",
    }


def test_register_login_me_refresh_logout_and_change_password(setup_test_database):
    client: TestClient
    client, _ = setup_test_database

    # register
    r = client.post("/auth/register", json=register_payload())
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["user"]["email"] == "user1@test.local"
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["refresh_token"]
    assert any(role["code"] == "CUSTOMER" for role in data["user"]["roles"])

    # login
    r = client.post("/auth/login", json={"identifier": "user1@test.local", "password": "Passw0rd123!"})
    assert r.status_code == 200, r.text
    login_data = r.json()
    access = login_data["access_token"]
    refresh = login_data["refresh_token"]

    # me
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert r.status_code == 200, r.text
    assert r.json()["email"] == "user1@test.local"

    # refresh rotation
    r = client.post("/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 200, r.text
    refreshed = r.json()
    assert refreshed["access_token"]
    assert refreshed["refresh_token"]
    assert refreshed["refresh_token"] != refresh

    # old refresh should no longer work
    r_old = client.post("/auth/refresh", json={"refresh_token": refresh})
    assert r_old.status_code == 401

    # change password
    r = client.post(
        "/auth/change-password",
        json={"current_password": "Passw0rd123!", "new_password": "NewPassw0rd123!"},
        headers={"Authorization": f"Bearer {access}"},
    )
    assert r.status_code == 200, r.text

    # old password fails
    r = client.post("/auth/login", json={"identifier": "user1@test.local", "password": "Passw0rd123!"})
    assert r.status_code == 401

    # new password works
    r = client.post("/auth/login", json={"identifier": "user1@test.local", "password": "NewPassw0rd123!"})
    assert r.status_code == 200, r.text
    new_refresh = r.json()["refresh_token"]

    # logout
    r = client.post("/auth/logout", json={"refresh_token": new_refresh})
    assert r.status_code == 200, r.text

    # revoked refresh fails
    r = client.post("/auth/refresh", json={"refresh_token": new_refresh})
    assert r.status_code == 401


def test_role_protection_admin_vs_customer(setup_test_database):
    client: TestClient
    client, _ = setup_test_database

    # create customer
    r = client.post(
        "/auth/register",
        json={
            "email": "cust2@test.local",
            "username": "cust2",
            "password": "Passw0rd123!",
        },
    )
    assert r.status_code == 201
    customer_access = r.json()["access_token"]

    # customer cannot access admin endpoint
    r = client.get("/auth/admin-check", headers={"Authorization": f"Bearer {customer_access}"})
    assert r.status_code == 403

    # seeded admin can login and access admin endpoint
    r = client.post("/auth/login", json={"identifier": "admin@test.local", "password": "AdminPass123!"})
    assert r.status_code == 200, r.text
    admin_access = r.json()["access_token"]
    r = client.get("/auth/admin-check", headers={"Authorization": f"Bearer {admin_access}"})
    assert r.status_code == 200, r.text
    assert r.json()["message"] == "Admin access granted"
