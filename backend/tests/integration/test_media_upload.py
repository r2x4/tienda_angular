import io
import os
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.core.security import hash_password
from app.modules.auth.models import Role, User
from app.modules.auth.service import ROLE_ADMIN, ROLE_CUSTOMER
from app.modules.media.storage import LocalMediaStorage


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


def _make_image_bytes(fmt="PNG", size=(32, 32), color=(255, 0, 0)) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=fmt)
    return buf.getvalue()


def test_media_upload_requires_auth(setup_test_database):
    client, _ = setup_test_database
    files = {"file": ("img.png", _make_image_bytes("PNG"), "image/png")}
    r = client.post("/admin/media/images", files=files)
    assert r.status_code == 401


def test_media_upload_requires_admin_role(setup_test_database):
    client, _ = setup_test_database
    headers = _customer_headers(client)
    files = {"file": ("img.png", _make_image_bytes("PNG"), "image/png")}
    r = client.post("/admin/media/images", files=files, headers=headers)
    assert r.status_code == 403


def test_media_upload_success_and_public_access(setup_test_database, tmp_path):
    client, _ = setup_test_database
    from app.core.config import settings
    old_root = settings.media_root
    try:
        settings.media_root = str(tmp_path / "media")
        LocalMediaStorage(settings).ensure_directories()

        headers = _admin_headers(client)
        files = {"file": ("photo.png", _make_image_bytes("PNG"), "image/png")}
        r = client.post("/admin/media/images", files=files, headers=headers)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["url"].startswith("/media/images/")
        assert body["filename"].endswith(".png")
        assert body["content_type"] == "image/png"
        assert body["size_bytes"] > 0
        assert Path(settings.media_root, "images", body["filename"]).exists()

        # public access through static mount (same app process may not remount; verify file existence + URL contract)
        # Static serving is verified in docker/runtime smoke; here we verify stored file and metadata.
    finally:
        settings.media_root = old_root


def test_media_upload_rejects_bad_extension_and_fake_mime(setup_test_database):
    client, _ = setup_test_database
    headers = _admin_headers(client)
    # bad extension/content type text
    files = {"file": ("evil.txt", b"not an image", "text/plain")}
    r = client.post("/admin/media/images", files=files, headers=headers)
    assert r.status_code in (415, 422)

    # fake mime but actually text
    files = {"file": ("evil.png", b"not an image", "image/png")}
    r = client.post("/admin/media/images", files=files, headers=headers)
    assert r.status_code in (415, 422)


def test_media_upload_rejects_oversized_file(setup_test_database, monkeypatch):
    client, _ = setup_test_database
    from app.core.config import settings
    monkeypatch.setattr(settings, "media_max_upload_mb", 1)
    headers = _admin_headers(client)
    big = b"0" * (1024 * 1024 + 1)
    files = {"file": ("big.png", big, "image/png")}
    r = client.post("/admin/media/images", files=files, headers=headers)
    assert r.status_code == 413


def test_media_upload_rejects_path_traversal_filename(setup_test_database, tmp_path):
    client, _ = setup_test_database
    from app.core.config import settings
    old_root = settings.media_root
    try:
        settings.media_root = str(tmp_path / "media")
        LocalMediaStorage(settings).ensure_directories()
        headers = _admin_headers(client)
        files = {"file": ("../../evil.png", _make_image_bytes("PNG"), "image/png")}
        r = client.post("/admin/media/images", files=files, headers=headers)
        assert r.status_code == 201, r.text
        body = r.json()
        assert "/" not in body["filename"]
        assert "\\" not in body["filename"]
        assert body["filename"].endswith(".png")
        stored = Path(settings.media_root, "images", body["filename"]).resolve()
        assert Path(settings.media_root, "images").resolve() in stored.parents
    finally:
        settings.media_root = old_root


def test_media_upload_compat_with_product_and_service_contracts(setup_test_database, tmp_path):
    client, _ = setup_test_database
    from app.core.config import settings
    old_root = settings.media_root
    try:
        settings.media_root = str(tmp_path / "media")
        LocalMediaStorage(settings).ensure_directories()
        headers = _admin_headers(client)
        up = client.post("/admin/media/images", files={"file": ("p.png", _make_image_bytes("PNG"), "image/png")}, headers=headers)
        assert up.status_code == 201
        image_url = up.json()["url"]

        # existing product contract accepts image URL
        cat = client.post("/admin/catalog/categories", json={"name": "Cat Media", "slug": f"cat-media-{uuid.uuid4().hex[:6]}"}, headers=headers)
        assert cat.status_code == 201, cat.text
        prod = client.post("/admin/catalog/products", json={
            "category_id": cat.json()["id"],
            "name": "Prod Media",
            "slug": f"prod-media-{uuid.uuid4().hex[:6]}",
            "price_cop": "1000.00",
            "stock_quantity": 1,
            "images": [{"url": image_url, "alt_text": "img", "is_primary": True, "sort_order": 0}],
        }, headers=headers)
        assert prod.status_code == 201, prod.text
        assert prod.json()["images"][0]["url"] == image_url

        # existing service contract accepts image_url
        svc = client.post("/admin/services", json={
            "name": "Svc Media",
            "slug": f"svc-media-{uuid.uuid4().hex[:6]}",
            "price_cop": "1000.00",
            "image_url": image_url,
        }, headers=headers)
        assert svc.status_code == 201, svc.text
        assert svc.json()["image_url"] == image_url
    finally:
        settings.media_root = old_root


def test_media_public_headers_nosniff_and_cache_policy(setup_test_database):
    client, _ = setup_test_database
    from app.core.config import settings
    # StaticFiles mount is configured at app creation; write into current mounted media root.
    LocalMediaStorage(settings).ensure_directories()
    filename = f"hdr-{uuid.uuid4().hex}.png"
    file_path = Path(settings.media_root, "images", filename)
    file_path.write_bytes(_make_image_bytes("PNG"))
    try:
        r = client.get(f"/media/images/{filename}")
        assert r.status_code == 200
        assert r.headers.get("x-content-type-options") == "nosniff"
        assert r.headers.get("cache-control") == "public, max-age=31536000, immutable"
    finally:
        if file_path.exists():
            file_path.unlink()
