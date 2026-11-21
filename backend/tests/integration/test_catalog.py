from decimal import Decimal

from fastapi.testclient import TestClient


def _register_and_login(client: TestClient, email: str, username: str, password: str = "Passw0rd123!"):
    r = client.post(
        "/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    assert r.status_code == 201, r.text
    data = r.json()
    return data["access_token"], data["user"]


def _login(client: TestClient, identifier: str, password: str):
    r = client.post("/auth/login", json={"identifier": identifier, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _admin_headers(client: TestClient):
    token = _login(client, "admin@example.com", "AdminPass123!")
    return {"Authorization": f"Bearer {token}"}


def _create_category(client: TestClient, headers, name="Electronics", slug="electronics"):
    r = client.post(
        "/admin/catalog/categories",
        json={"name": name, "slug": slug, "description": "desc", "is_active": True},
        headers=headers,
    )
    assert r.status_code == 201, r.text
    return r.json()


def _create_product(client: TestClient, headers, category_id: str, **overrides):
    payload = {
        "category_id": category_id,
        "name": "Phone",
        "slug": "phone",
        "description": "Smartphone",
        "price_cop": "1200000.00",
        "stock_quantity": 10,
        "is_active": True,
        "images": [
            {"url": "https://example.com/p1.jpg", "alt_text": "front", "is_primary": True, "sort_order": 0}
        ],
    }
    payload.update(overrides)
    r = client.post("/admin/catalog/products", json=payload, headers=headers)
    return r


def test_category_crud_and_admin_protection(setup_test_database):
    client, _ = setup_test_database
    admin_headers = _admin_headers(client)
    customer_token, _ = _register_and_login(client, "c1@example.com", "custcat")
    customer_headers = {"Authorization": f"Bearer {customer_token}"}

    # protection
    r = client.post("/admin/catalog/categories", json={"name": "X", "is_active": True})
    assert r.status_code == 401
    r = client.post("/admin/catalog/categories", json={"name": "X", "is_active": True}, headers=customer_headers)
    assert r.status_code == 403

    # create
    cat = _create_category(client, admin_headers, name="Home", slug="home")
    assert cat["name"] == "Home"
    assert cat["is_active"] is True

    # read admin
    r = client.get(f"/admin/catalog/categories/{cat['id']}", headers=admin_headers)
    assert r.status_code == 200

    # update
    r = client.put(
        f"/admin/catalog/categories/{cat['id']}",
        json={"name": "Home & Living", "slug": "home-living", "description": "updated", "is_active": True},
        headers=admin_headers,
    )
    assert r.status_code == 200, r.text
    assert r.json()["slug"] == "home-living"

    # deactivate
    r = client.patch(f"/admin/catalog/categories/{cat['id']}/deactivate", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["is_active"] is False

    # public list should not include inactive category
    r = client.get("/catalog/categories")
    assert r.status_code == 200
    assert all(c["id"] != cat["id"] for c in r.json())


def test_product_crud_public_admin_and_deactivation(setup_test_database):
    client, _ = setup_test_database
    admin_headers = _admin_headers(client)
    cat = _create_category(client, admin_headers, name="Tech", slug="tech")

    # create
    r = _create_product(client, admin_headers, cat["id"], name="Laptop", slug="laptop", price_cop="3500000.00", stock_quantity=5)
    assert r.status_code == 201, r.text
    prod = r.json()
    assert Decimal(prod["price_cop"]) == Decimal("3500000.00")
    assert prod["stock_quantity"] == 5
    assert prod["category"]["id"] == cat["id"]
    assert len(prod["images"]) == 1

    # public read
    r = client.get(f"/catalog/products/{prod['id']}")
    assert r.status_code == 200
    r = client.get("/catalog/products")
    assert r.status_code == 200
    assert any(p["id"] == prod["id"] for p in r.json())

    # update
    r = client.put(
        f"/admin/catalog/products/{prod['id']}",
        json={"name": "Laptop Pro", "price_cop": "3600000.00", "stock_quantity": 7},
        headers=admin_headers,
    )
    assert r.status_code == 200, r.text
    updated = r.json()
    assert updated["name"] == "Laptop Pro"
    assert Decimal(updated["price_cop"]) == Decimal("3600000.00")
    assert updated["stock_quantity"] == 7

    # deactivate
    r = client.patch(f"/admin/catalog/products/{prod['id']}/deactivate", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["is_active"] is False

    # public should not see deactivated product
    r = client.get(f"/catalog/products/{prod['id']}")
    assert r.status_code == 404
    r = client.get("/catalog/products")
    assert all(p["id"] != prod["id"] for p in r.json())


def test_product_validations_and_integrity(setup_test_database):
    client, _ = setup_test_database
    admin_headers = _admin_headers(client)
    cat = _create_category(client, admin_headers, name="Garden", slug="garden")

    # invalid price
    r = _create_product(client, admin_headers, cat["id"], name="BadPrice", slug="bad-price", price_cop="-1.00")
    assert r.status_code == 422

    # invalid stock
    r = _create_product(client, admin_headers, cat["id"], name="BadStock", slug="bad-stock", stock_quantity=-5)
    assert r.status_code == 422

    # missing required name
    bad = {
        "category_id": cat["id"],
        "slug": "no-name",
        "price_cop": "1000.00",
        "stock_quantity": 1,
        "is_active": True,
    }
    r = client.post("/admin/catalog/products", json=bad, headers=admin_headers)
    assert r.status_code == 422

    # nonexistent category
    r = _create_product(client, admin_headers, "00000000-0000-0000-0000-000000000999", name="NoCat", slug="nocat")
    assert r.status_code == 404

    # integrity: cannot assign inactive category on create
    r = client.patch(f"/admin/catalog/categories/{cat['id']}/deactivate", headers=admin_headers)
    assert r.status_code == 200
    r = _create_product(client, admin_headers, cat["id"], name="Blocked", slug="blocked")
    assert r.status_code == 409


def test_product_availability(setup_test_database):
    client, _ = setup_test_database
    admin_headers = _admin_headers(client)
    cat = _create_category(client, admin_headers, name="StockCat", slug="stockcat")
    r = _create_product(client, admin_headers, cat["id"], name="StockItem", slug="stockitem", stock_quantity=3)
    assert r.status_code == 201
    prod = r.json()

    r = client.get(f"/catalog/products/{prod['id']}/availability")
    assert r.status_code == 200
    data = r.json()
    assert data["available"] is True
    assert data["stock_quantity"] == 3

    r = client.put(
        f"/admin/catalog/products/{prod['id']}",
        json={"stock_quantity": 0},
        headers=admin_headers,
    )
    assert r.status_code == 200
    r = client.get(f"/catalog/products/{prod['id']}/availability")
    assert r.status_code == 200
    assert r.json()["available"] is False
