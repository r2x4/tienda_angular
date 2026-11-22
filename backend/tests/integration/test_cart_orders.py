import uuid
from decimal import Decimal
from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.modules.catalog.models import Product


def _register(client: TestClient, email: str, username: str, password: str = "Passw0rd123!"):
    r = client.post("/auth/register", json={"email": email, "username": username, "password": password})
    assert r.status_code == 201, r.text
    return r.json()


def _login(client: TestClient, identifier: str, password: str):
    r = client.post("/auth/login", json={"identifier": identifier, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


def _admin_headers(client: TestClient):
    data = _login(client, "admin@example.com", "AdminPass123!")
    return {"Authorization": f"Bearer {data['access_token']}"}


def _create_category(client: TestClient, headers, name="Cat", slug=None):
    slug = slug or f"cat-{uuid.uuid4().hex[:8]}"
    r = client.post("/admin/catalog/categories", json={"name": name, "slug": slug, "is_active": True}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def _create_product(client: TestClient, headers, category_id, name="Prod", slug=None, price="1000.00", stock=10):
    slug = slug or f"prod-{uuid.uuid4().hex[:8]}"
    r = client.post(
        "/admin/catalog/products",
        json={
            "category_id": category_id,
            "name": name,
            "slug": slug,
            "description": "d",
            "price_cop": price,
            "stock_quantity": stock,
            "is_active": True,
            "images": [],
        },
        headers=headers,
    )
    assert r.status_code == 201, r.text
    return r.json()


def test_cart_add_update_remove_clear(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    cat = _create_category(client, admin, "C1")
    p1 = _create_product(client, admin, cat["id"], "P1", price="100.00", stock=10)
    p2 = _create_product(client, admin, cat["id"], "P2", price="50.00", stock=10)

    r = client.post("/cart/items", json={"product_id": p1["id"], "quantity": 2})
    assert r.status_code == 201, r.text
    cart = r.json()
    token = cart["guest_cart_token"]
    assert token
    assert len(cart["items"]) == 1
    assert Decimal(cart["total_cop"]) == Decimal("200.00")

    r = client.post("/cart/items", json={"product_id": p2["id"], "quantity": 1}, headers={"X-Cart-Token": token})
    assert r.status_code == 201
    assert len(r.json()["items"]) == 2

    r = client.patch(f"/cart/items/{p1['id']}", json={"quantity": 3}, headers={"X-Cart-Token": token})
    assert r.status_code == 200
    assert Decimal(r.json()["total_cop"]) == Decimal("350.00")

    r = client.delete(f"/cart/items/{p2['id']}", headers={"X-Cart-Token": token})
    assert r.status_code == 200
    assert len(r.json()["items"]) == 1

    r = client.delete("/cart", headers={"X-Cart-Token": token})
    assert r.status_code == 200
    assert r.json()["items"] == []


def test_cart_rejects_inactive_and_invalid_quantity(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    cat = _create_category(client, admin, "C2")
    p = _create_product(client, admin, cat["id"], "P3", price="100.00", stock=2)

    r = client.post("/cart/items", json={"product_id": p["id"], "quantity": 0})
    assert r.status_code == 422

    r = client.post("/cart/items", json={"product_id": p["id"], "quantity": 3})
    assert r.status_code == 409

    r = client.patch(f"/admin/catalog/products/{p['id']}/deactivate", headers=admin)
    assert r.status_code == 200
    r = client.post("/cart/items", json={"product_id": p["id"], "quantity": 1})
    assert r.status_code == 404


def test_guest_checkout_success_persists_order_and_clears_cart(setup_test_database):
    client, SessionLocal = setup_test_database
    admin = _admin_headers(client)
    cat = _create_category(client, admin, "C3")
    p = _create_product(client, admin, cat["id"], "P4", price="1200.00", stock=5)

    r = client.post("/cart/items", json={"product_id": p["id"], "quantity": 2})
    assert r.status_code == 201
    token = r.json()["guest_cart_token"]

    checkout = {
        "buyer": {"full_name": "Guest Buyer", "email": f"guest-{uuid.uuid4().hex[:6]}@example.com", "phone": "123", "address": "Street 1"},
        "idempotency_key": f"guest-checkout-{uuid.uuid4().hex}",
    }
    r = client.post("/orders/checkout", json=checkout, headers={"X-Cart-Token": token})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["guest_order_access_token"]
    order = body["order"]
    assert order["status"] == "CONFIRMED"
    assert order["currency"] == "COP"
    assert Decimal(order["total"]) == Decimal("2400.00")
    assert order["items"][0]["product_name"] == "P4"
    assert Decimal(order["items"][0]["unit_price_cop"]) == Decimal("1200.00")

    r = client.get("/cart", headers={"X-Cart-Token": token})
    assert r.status_code == 200
    assert r.json()["items"] == []

    with SessionLocal() as db:
        prod = db.execute(select(Product).where(Product.id == p["id"])).scalar_one()
        assert prod.stock_quantity == 3


def test_checkout_uses_current_price_and_validates_stock(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    cat = _create_category(client, admin, "C4")
    p = _create_product(client, admin, cat["id"], "P5", price="100.00", stock=1)

    r = client.post("/cart/items", json={"product_id": p["id"], "quantity": 1})
    token = r.json()["guest_cart_token"]

    r = client.put(f"/admin/catalog/products/{p['id']}", json={"price_cop": "150.00"}, headers=admin)
    assert r.status_code == 200

    checkout = {"buyer": {"full_name": "Guest Two", "email": f"g2-{uuid.uuid4().hex[:6]}@example.com", "address": "Address 1"}, "idempotency_key": f"guest-key-{uuid.uuid4().hex}"}
    r = client.post("/orders/checkout", json=checkout, headers={"X-Cart-Token": token})
    assert r.status_code == 201, r.text
    assert Decimal(r.json()["order"]["total"]) == Decimal("150.00")

    p2 = _create_product(client, admin, cat["id"], "P6", price="100.00", stock=1)
    r = client.post("/cart/items", json={"product_id": p2["id"], "quantity": 1})
    token2 = r.json()["guest_cart_token"]
    r = client.put(f"/admin/catalog/products/{p2['id']}", json={"stock_quantity": 0}, headers=admin)
    assert r.status_code == 200
    r = client.post("/orders/checkout", json={"buyer": {"full_name": "Guest Three", "email": f"g3-{uuid.uuid4().hex[:6]}@example.com", "address": "Address 2"}, "idempotency_key": f"guest-key-{uuid.uuid4().hex}"}, headers={"X-Cart-Token": token2})
    assert r.status_code == 409


def test_authenticated_checkout_history_and_permissions(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    cat = _create_category(client, admin, "C5")
    p = _create_product(client, admin, cat["id"], "P7", price="500.00", stock=5)

    u1 = _register(client, f"u1-{uuid.uuid4().hex[:6]}@example.com", f"user1_{uuid.uuid4().hex[:6]}")
    u2 = _register(client, f"u2-{uuid.uuid4().hex[:6]}@example.com", f"user2_{uuid.uuid4().hex[:6]}")
    h1 = {"Authorization": f"Bearer {u1['access_token']}"}
    h2 = {"Authorization": f"Bearer {u2['access_token']}"}

    r = client.post("/cart/items", json={"product_id": p["id"], "quantity": 1}, headers=h1)
    assert r.status_code == 201
    r = client.post("/orders/checkout", json={"idempotency_key": f"user-order-{uuid.uuid4().hex}"}, headers=h1)
    assert r.status_code == 201, r.text
    order_id = r.json()["order"]["id"]

    r = client.get("/orders/my", headers=h1)
    assert r.status_code == 200
    assert any(o["id"] == order_id for o in r.json())

    r = client.get(f"/orders/my/{order_id}", headers=h1)
    assert r.status_code == 200

    r = client.get(f"/orders/my/{order_id}", headers=h2)
    assert r.status_code == 404

    r = client.get("/admin/orders", headers=h1)
    assert r.status_code == 403
    r = client.get("/admin/orders", headers=admin)
    assert r.status_code == 200
    assert any(o["id"] == order_id for o in r.json())


def test_guest_order_access_token_required(setup_test_database):
    client, _ = setup_test_database
    admin = _admin_headers(client)
    cat = _create_category(client, admin, "C6")
    p = _create_product(client, admin, cat["id"], "P8", price="100.00", stock=2)
    r = client.post("/cart/items", json={"product_id": p["id"], "quantity": 1})
    token = r.json()["guest_cart_token"]
    r = client.post("/orders/checkout", json={"buyer": {"full_name": "Guest Four", "email": f"g4-{uuid.uuid4().hex[:6]}@example.com", "address": "Address 4"}, "idempotency_key": f"guest-key-{uuid.uuid4().hex}"}, headers={"X-Cart-Token": token})
    assert r.status_code == 201
    order_id = r.json()["order"]["id"]
    access = r.json()["guest_order_access_token"]

    r = client.get(f"/orders/guest/{order_id}")
    assert r.status_code == 404
    r = client.get(f"/orders/guest/{order_id}", headers={"X-Order-Access-Token": "wrong-token-1234567890"})
    assert r.status_code == 404
    r = client.get(f"/orders/guest/{order_id}", headers={"X-Order-Access-Token": access})
    assert r.status_code == 200


def test_checkout_idempotency_prevents_duplicate_orders(setup_test_database):
    client, SessionLocal = setup_test_database
    admin = _admin_headers(client)
    cat = _create_category(client, admin, "C7")
    p = _create_product(client, admin, cat["id"], "P9", price="100.00", stock=5)

    r = client.post("/cart/items", json={"product_id": p["id"], "quantity": 1})
    token = r.json()["guest_cart_token"]
    payload = {"buyer": {"full_name": "Guest Five", "email": f"g5-{uuid.uuid4().hex[:6]}@example.com", "address": "Address 5"}, "idempotency_key": f"same-key-{uuid.uuid4().hex}"}
    r1 = client.post("/orders/checkout", json=payload, headers={"X-Cart-Token": token})
    assert r1.status_code == 201
    r2 = client.post("/orders/checkout", json=payload, headers={"X-Cart-Token": token})
    assert r2.status_code == 201
    assert r1.json()["order"]["id"] == r2.json()["order"]["id"]

    with SessionLocal() as db:
        prod = db.execute(select(Product).where(Product.id == p["id"])).scalar_one()
        assert prod.stock_quantity == 4


def test_concurrent_checkouts_only_one_succeeds_for_last_unit(setup_test_database):
    client, SessionLocal = setup_test_database
    admin = _admin_headers(client)
    cat = _create_category(client, admin, "C8")
    p = _create_product(client, admin, cat["id"], "P10", price="100.00", stock=1)

    r1 = client.post("/cart/items", json={"product_id": p["id"], "quantity": 1})
    t1 = r1.json()["guest_cart_token"]
    r2 = client.post("/cart/items", json={"product_id": p["id"], "quantity": 1})
    t2 = r2.json()["guest_cart_token"]

    payload1 = {"buyer": {"full_name": "Buyer A", "email": f"a-{uuid.uuid4().hex[:6]}@example.com", "address": "Address A"}, "idempotency_key": f"concurrent-{uuid.uuid4().hex}"}
    payload2 = {"buyer": {"full_name": "Buyer B", "email": f"b-{uuid.uuid4().hex[:6]}@example.com", "address": "Address B"}, "idempotency_key": f"concurrent-{uuid.uuid4().hex}"}

    def do_checkout(token, payload):
        with TestClient(client.app) as c:
            return c.post("/orders/checkout", json=payload, headers={"X-Cart-Token": token})

    with ThreadPoolExecutor(max_workers=2) as ex:
        f1 = ex.submit(do_checkout, t1, payload1)
        f2 = ex.submit(do_checkout, t2, payload2)
        res1 = f1.result()
        res2 = f2.result()

    codes = sorted([res1.status_code, res2.status_code])
    assert codes == [201, 409], (res1.status_code, res1.text, res2.status_code, res2.text)

    with SessionLocal() as db:
        prod = db.execute(select(Product).where(Product.id == p["id"])).scalar_one()
        assert prod.stock_quantity == 0
