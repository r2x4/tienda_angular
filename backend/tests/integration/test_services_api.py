import uuid
from decimal import Decimal

from fastapi.testclient import TestClient


def _login(client: TestClient, identifier: str, password: str):
    r = client.post("/auth/login", json={"identifier": identifier, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


def _register(client: TestClient, email: str, username: str, password: str = "Passw0rd123!"):
    r = client.post("/auth/register", json={"email": email, "username": username, "password": password})
    assert r.status_code == 201, r.text
    return r.json()


def _admin_headers(client: TestClient):
    data = _login(client, "admin@example.com", "AdminPass123!")
    return {"Authorization": f"Bearer {data['access_token']}"}


def _customer_headers(client: TestClient):
    suffix = uuid.uuid4().hex[:6]
    data = _register(client, f"cust-{suffix}@example.com", f"cust_{suffix}")
    return {"Authorization": f"Bearer {data['access_token']}"}


def _service_payload(**kwargs):
    suffix = uuid.uuid4().hex[:8]
    base = {
        "name": "Service A",
        "slug": f"service-{suffix}",
        "description": "Desc",
        "price_cop": "25000.00",
        "duration_minutes": 30,
        "image_url": "https://example.com/s.jpg",
        "is_active": True,
    }
    base.update(kwargs)
    return base


def _create_service(client: TestClient, headers, **kwargs):
    r = client.post("/admin/services", json=_service_payload(**kwargs), headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def test_public_list_returns_only_active(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    active = _create_service(client, admin, name="Active Svc", is_active=True)
    inactive = _create_service(client, admin, name="Inactive Svc", is_active=False)

    r = client.get("/services")
    assert r.status_code == 200
    data = r.json()
    ids = [i["id"] for i in data["items"]]
    assert active["id"] in ids
    assert inactive["id"] not in ids


def test_public_get_active_service(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    svc = _create_service(client, admin, name="Public Svc")
    r = client.get(f"/services/{svc['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == svc["id"]


def test_public_get_inactive_returns_404(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    svc = _create_service(client, admin, is_active=False)
    r = client.get(f"/services/{svc['id']}")
    assert r.status_code == 404


def test_public_get_nonexistent_returns_404(setup_test_database):
    client, _ = setup_test_database
    r = client.get(f"/services/{uuid.uuid4()}")
    assert r.status_code == 404


def test_admin_requires_auth_and_role(setup_test_database):
    client, _ = setup_test_database
    r = client.get("/admin/services")
    assert r.status_code == 401
    cust = _customer_headers(client)
    r = client.get("/admin/services", headers=cust)
    assert r.status_code == 403
    admin = _admin_headers(client)
    r = client.get("/admin/services", headers=admin)
    assert r.status_code == 200


def test_admin_create_service_201(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    payload = _service_payload(name="Create Svc")
    r = client.post("/admin/services", json=payload, headers=admin)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["name"] == "Create Svc"
    assert Decimal(body["price_cop"]) == Decimal("25000.00")


def test_admin_create_duplicate_slug_409(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    slug = f"dup-{uuid.uuid4().hex[:6]}"
    r1 = client.post("/admin/services", json=_service_payload(slug=slug), headers=admin)
    assert r1.status_code == 201
    r2 = client.post("/admin/services", json=_service_payload(slug=slug), headers=admin)
    assert r2.status_code == 409


def test_admin_list_includes_inactive_and_filter(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    active = _create_service(client, admin, is_active=True)
    inactive = _create_service(client, admin, is_active=False)

    r = client.get("/admin/services", headers=admin)
    assert r.status_code == 200
    ids = [i["id"] for i in r.json()["items"]]
    assert active["id"] in ids and inactive["id"] in ids

    r = client.get("/admin/services?is_active=false", headers=admin)
    assert r.status_code == 200
    ids = [i["id"] for i in r.json()["items"]]
    assert inactive["id"] in ids
    assert all(not i["is_active"] for i in r.json()["items"])


def test_admin_get_inactive_service(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    svc = _create_service(client, admin, is_active=False)
    r = client.get(f"/admin/services/{svc['id']}", headers=admin)
    assert r.status_code == 200
    assert r.json()["id"] == svc["id"]


def test_admin_patch_partial_update(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    svc = _create_service(client, admin, name="Old", description="Desc")
    r = client.patch(f"/admin/services/{svc['id']}", json={"name": "New", "description": None}, headers=admin)
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "New"
    assert body["description"] is None
    assert body["slug"] == svc["slug"]


def test_admin_rejects_more_than_two_decimals_and_null_is_active(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    svc = _create_service(client, admin)
    r = client.patch(f"/admin/services/{svc['id']}", json={"price_cop": "10.999"}, headers=admin)
    assert r.status_code == 422
    r = client.patch(f"/admin/services/{svc['id']}", json={"is_active": None}, headers=admin)
    assert r.status_code == 422


def test_admin_activate_deactivate(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    svc = _create_service(client, admin, is_active=True)
    r = client.patch(f"/admin/services/{svc['id']}/deactivate", headers=admin)
    assert r.status_code == 200
    assert r.json()["is_active"] is False
    r = client.patch(f"/admin/services/{svc['id']}/activate", headers=admin)
    assert r.status_code == 200
    assert r.json()["is_active"] is True


def test_admin_nonexistent_uuid_404(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    missing = uuid.uuid4()
    assert client.get(f"/admin/services/{missing}", headers=admin).status_code == 404
    assert client.patch(f"/admin/services/{missing}", json={"name": "X"}, headers=admin).status_code == 404
    assert client.patch(f"/admin/services/{missing}/activate", headers=admin).status_code == 404
    assert client.patch(f"/admin/services/{missing}/deactivate", headers=admin).status_code == 404
