from fastapi.testclient import TestClient


def register_payload(email="user1@example.com", username="user1", password="Passw0rd123!"):
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

    r = client.post("/auth/register", json=register_payload())
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["user"]["email"] == "user1@example.com"
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["refresh_token"]
    assert any(role["code"] == "CUSTOMER" for role in data["user"]["roles"])

    r = client.post("/auth/login", json={"identifier": "user1@example.com", "password": "Passw0rd123!"})
    assert r.status_code == 200, r.text
    login_data = r.json()
    access = login_data["access_token"]
    refresh = login_data["refresh_token"]

    r = client.get("/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert r.status_code == 200, r.text
    assert r.json()["email"] == "user1@example.com"

    r = client.post("/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 200, r.text
    refreshed = r.json()
    assert refreshed["access_token"]
    assert refreshed["refresh_token"]
    assert refreshed["refresh_token"] != refresh

    r_old = client.post("/auth/refresh", json={"refresh_token": refresh})
    assert r_old.status_code == 401

    r = client.post(
        "/auth/change-password",
        json={"current_password": "Passw0rd123!", "new_password": "NewPassw0rd123!"},
        headers={"Authorization": f"Bearer {access}"},
    )
    assert r.status_code == 200, r.text

    r = client.post("/auth/login", json={"identifier": "user1@example.com", "password": "Passw0rd123!"})
    assert r.status_code == 401

    r = client.post("/auth/login", json={"identifier": "user1@example.com", "password": "NewPassw0rd123!"})
    assert r.status_code == 200, r.text
    new_refresh = r.json()["refresh_token"]

    r = client.post("/auth/logout", json={"refresh_token": new_refresh})
    assert r.status_code == 200, r.text

    r = client.post("/auth/refresh", json={"refresh_token": new_refresh})
    assert r.status_code == 401
