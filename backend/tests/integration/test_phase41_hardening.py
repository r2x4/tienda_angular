import uuid
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.modules.cart.models import CartItem
from app.modules.catalog.models import Product
from app.modules.orders.models import Order, OrderItem


def _login(client: TestClient, identifier: str, password: str):
    r = client.post("/auth/login", json={"identifier": identifier, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


def _admin_headers(client: TestClient):
    data = _login(client, "admin@example.com", "AdminPass123!")
    return {"Authorization": f"Bearer {data["access_token"]}"}


def _register(client: TestClient, email: str, username: str, password: str = "Passw0rd123!"):
    r = client.post("/auth/register", json={"email": email, "username": username, "password": password})
    assert r.status_code == 201, r.text
    return r.json()


def _create_category(client: TestClient, headers, name=None):
    suffix = uuid.uuid4().hex[:8]
    name = name or f"Cat-{suffix}"
    slug = f"cat-{suffix}"
    r = client.post("/admin/catalog/categories", json={"name": name, "slug": slug, "is_active": True}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def _create_product(client: TestClient, headers, category_id, name="Prod", price="1000.00", stock=10):
    slug = f"prod-{uuid.uuid4().hex[:8]}"
    r = client.post(
        "/admin/catalog/products",
        json={"category_id": category_id, "name": name, "slug": slug, "price_cop": price, "stock_quantity": stock, "is_active": True, "images": []},
        headers=headers,
    )
    assert r.status_code == 201, r.text
    return r.json()


def test_checkout_rollback_on_internal_error(setup_test_database, monkeypatch):
    client, SessionLocal = setup_test_database
    admin = _admin_headers(client)
    cat = _create_category(client, admin, "RollbackCat")
    p = _create_product(client, admin, cat["id"], "RollbackProd", price="100.00", stock=5)

    r = client.post("/cart/items", json={"product_id": p["id"], "quantity": 2})
    assert r.status_code == 201
    token = r.json()["guest_cart_token"]

    import app.modules.orders.service as order_service

    def boom():
        raise RuntimeError("forced checkout failure")

    monkeypatch.setattr(order_service, "_generate_order_number", boom)

    payload = {
        "buyer": {"full_name": "Rollback Guest", "email": f"rb-{uuid.uuid4().hex[:6]}@example.com", "address": "Address 123"},
        "idempotency_key": f"rb-{uuid.uuid4().hex}",
    }
    r = client.post("/orders/checkout", json=payload, headers={"X-Cart-Token": token})
    assert r.status_code == 500
    assert r.json()["detail"] == "Checkout failed"

    with SessionLocal() as db:
        prod = db.execute(select(Product).where(Product.id == p["id"])).scalar_one()
        assert prod.stock_quantity == 5
        cart_items = db.execute(select(CartItem).where(CartItem.product_id == p["id"])).scalars().all()
        assert len(cart_items) == 1
        assert cart_items[0].quantity == 2
        oi = db.execute(select(OrderItem).where(OrderItem.product_id == p["id"])).scalars().all()
        assert oi == []
        # no order for this idempotency key
        o = db.execute(select(Order).where(Order.idempotency_key == payload["idempotency_key"])).scalar_one_or_none()
        assert o is None


def test_idempotency_same_key_same_user_returns_same_order(setup_test_database):
    client, SessionLocal = setup_test_database
    admin = _admin_headers(client)
    cat = _create_category(client, admin)
    p = _create_product(client, admin, cat["id"], stock=10)
    user = _register(client, f"idemp-{uuid.uuid4().hex[:6]}@example.com", f"idemp_{uuid.uuid4().hex[:6]}")
    headers = {"Authorization": f"Bearer {user['access_token']}"}

    r = client.post("/cart/items", json={"product_id": p["id"], "quantity": 1}, headers=headers)
    assert r.status_code == 201
    key = f"idem-{uuid.uuid4().hex}"
    r1 = client.post("/orders/checkout", json={"idempotency_key": key}, headers=headers)
    assert r1.status_code == 201
    r2 = client.post("/orders/checkout", json={"idempotency_key": key}, headers=headers)
    assert r2.status_code == 201
    assert r1.json()["order"]["id"] == r2.json()["order"]["id"]

    with SessionLocal() as db:
        prod = db.execute(select(Product).where(Product.id == p["id"])).scalar_one()
        assert prod.stock_quantity == 9


def test_idempotency_key_cannot_be_reused_by_different_user(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    cat = _create_category(client, admin)
    p1 = _create_product(client, admin, cat["id"], name="P1", stock=5)
    p2 = _create_product(client, admin, cat["id"], name="P2", stock=5)

    u1 = _register(client, f"u1-{uuid.uuid4().hex[:6]}@example.com", f"u1_{uuid.uuid4().hex[:6]}")
    u2 = _register(client, f"u2-{uuid.uuid4().hex[:6]}@example.com", f"u2_{uuid.uuid4().hex[:6]}")
    h1 = {"Authorization": f"Bearer {u1['access_token']}"}
    h2 = {"Authorization": f"Bearer {u2['access_token']}"}

    key = f"shared-{uuid.uuid4().hex}"
    assert client.post("/cart/items", json={"product_id": p1["id"], "quantity": 1}, headers=h1).status_code == 201
    r1 = client.post("/orders/checkout", json={"idempotency_key": key}, headers=h1)
    assert r1.status_code == 201

    assert client.post("/cart/items", json={"product_id": p2["id"], "quantity": 1}, headers=h2).status_code == 201
    r2 = client.post("/orders/checkout", json={"idempotency_key": key}, headers=h2)
    assert r2.status_code == 201
    assert r1.json()["order"]["id"] != r2.json()["order"]["id"]


def test_guest_idempotency_key_cannot_be_reused_by_different_guest_cart(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    cat = _create_category(client, admin)
    p1 = _create_product(client, admin, cat["id"], name="PG1", stock=5)
    p2 = _create_product(client, admin, cat["id"], name="PG2", stock=5)

    r = client.post("/cart/items", json={"product_id": p1["id"], "quantity": 1})
    t1 = r.json()["guest_cart_token"]
    r = client.post("/cart/items", json={"product_id": p2["id"], "quantity": 1})
    t2 = r.json()["guest_cart_token"]

    key = f"guest-shared-{uuid.uuid4().hex}"
    buyer1 = {"full_name": "Guest A", "email": f"a-{uuid.uuid4().hex[:6]}@example.com", "address": "Address A"}
    buyer2 = {"full_name": "Guest B", "email": f"b-{uuid.uuid4().hex[:6]}@example.com", "address": "Address B"}
    r1 = client.post("/orders/checkout", json={"buyer": buyer1, "idempotency_key": key}, headers={"X-Cart-Token": t1})
    assert r1.status_code == 201
    r2 = client.post("/orders/checkout", json={"buyer": buyer2, "idempotency_key": key}, headers={"X-Cart-Token": t2})
    assert r2.status_code == 201
    assert r1.json()["order"]["id"] != r2.json()["order"]["id"]


def test_guest_order_token_invalid_and_no_data_leak(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    cat = _create_category(client, admin)
    p = _create_product(client, admin, cat["id"], stock=2)
    r = client.post("/cart/items", json={"product_id": p["id"], "quantity": 1})
    token = r.json()["guest_cart_token"]
    r = client.post(
        "/orders/checkout",
        json={"buyer": {"full_name": "Guest Secret", "email": f"sec-{uuid.uuid4().hex[:6]}@example.com", "address": "Secret Address"}, "idempotency_key": f"k-{uuid.uuid4().hex}"},
        headers={"X-Cart-Token": token},
    )
    assert r.status_code == 201
    body = r.json()
    order_id = body["order"]["id"]
    assert body["guest_order_access_token"]
    assert "guest_email" not in body["order"]
    assert "guest_address" not in body["order"]
    assert "guest_full_name" not in body["order"]

    r = client.get(f"/orders/guest/{order_id}", headers={"X-Order-Access-Token": "invalid-token-value-1234567890"})
    assert r.status_code == 404
    assert r.json()["detail"] == "Order not found"
    r = client.get(f"/orders/guest/{order_id}")
    assert r.status_code == 404
