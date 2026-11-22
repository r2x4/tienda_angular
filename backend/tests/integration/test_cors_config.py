from fastapi.testclient import TestClient

from app.core.config import Settings
from app.db.session import get_db
from app.main import create_app


def test_cors_allows_configured_origin_and_headers(setup_test_database):
    # build isolated app with explicit CORS config
    _, SessionLocal = setup_test_database
    custom = Settings(
        APP_ENV='test',
        CORS_ALLOWED_ORIGINS='https://allowed.example.com',
        CORS_ALLOWED_METHODS='GET,POST,OPTIONS',
        CORS_ALLOWED_HEADERS='Authorization,Content-Type,Accept',
    )

    import app.main as main_mod
    old = main_mod.settings
    main_mod.settings = custom
    try:
        app = create_app()
        def override_get_db():
            db = SessionLocal()
            try:
                yield db
            finally:
                db.close()
        app.dependency_overrides[get_db] = override_get_db
        with TestClient(app) as client:
            r = client.options(
                '/auth/login',
                headers={
                    'Origin': 'https://allowed.example.com',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Authorization,Content-Type',
                },
            )
            assert r.status_code in (200, 204)
            assert r.headers.get('access-control-allow-origin') == 'https://allowed.example.com'
            allow_headers = r.headers.get('access-control-allow-headers', '').lower()
            assert 'authorization' in allow_headers
            assert 'content-type' in allow_headers
    finally:
        main_mod.settings = old


def test_cors_rejects_unconfigured_origin(setup_test_database):
    _, SessionLocal = setup_test_database
    custom = Settings(
        APP_ENV='test',
        CORS_ALLOWED_ORIGINS='https://allowed.example.com',
        CORS_ALLOWED_METHODS='GET,POST,OPTIONS',
        CORS_ALLOWED_HEADERS='Authorization,Content-Type,Accept',
    )
    import app.main as main_mod
    old = main_mod.settings
    main_mod.settings = custom
    try:
        app = create_app()
        def override_get_db():
            db = SessionLocal()
            try:
                yield db
            finally:
                db.close()
        app.dependency_overrides[get_db] = override_get_db
        with TestClient(app) as client:
            r = client.options(
                '/auth/login',
                headers={
                    'Origin': 'https://evil.example.com',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Authorization,Content-Type',
                },
            )
            # Starlette CORS returns 400 for disallowed preflight origin
            assert r.status_code in (400, 403)
            assert r.headers.get('access-control-allow-origin') is None
    finally:
        main_mod.settings = old


def test_cors_has_no_wildcard_in_production_config(setup_test_database):
    _, SessionLocal = setup_test_database
    custom = Settings(
        APP_ENV='production',
        JWT_SECRET_KEY='a-very-strong-jwt-secret-key-with-32-bytes-min!',
        POSTGRES_PASSWORD='StrongPgPassword123!',
        CORS_ALLOWED_ORIGINS='https://allowed.example.com',
        CORS_ALLOWED_METHODS='GET,POST,OPTIONS',
        CORS_ALLOWED_HEADERS='Authorization,Content-Type,Accept',
    )
    import app.main as main_mod
    old = main_mod.settings
    main_mod.settings = custom
    try:
        app = create_app()
        def override_get_db():
            db = SessionLocal()
            try:
                yield db
            finally:
                db.close()
        app.dependency_overrides[get_db] = override_get_db
        with TestClient(app) as client:
            r = client.options(
                '/auth/login',
                headers={
                    'Origin': 'https://allowed.example.com',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Authorization,Content-Type',
                },
            )
            assert r.headers.get('access-control-allow-origin') != '*'
    finally:
        main_mod.settings = old
