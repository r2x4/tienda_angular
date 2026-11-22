import pytest

from app.core.config import Settings, validate_runtime_security


def _base_prod_settings(**kwargs):
    data = dict(
        APP_ENV='production',
        POSTGRES_PASSWORD='StrongPgPassword123!',
        JWT_SECRET_KEY='a-very-strong-jwt-secret-key-with-32-bytes-min!',
        CORS_ALLOWED_ORIGINS='https://app.example.com',
    )
    data.update(kwargs)
    return Settings(**data)


def test_production_rejects_placeholder_jwt_secret():
    cfg = _base_prod_settings(JWT_SECRET_KEY='change_me_jwt_secret_key_at_least_32_chars')
    with pytest.raises(RuntimeError, match='JWT_SECRET_KEY'):
        validate_runtime_security(cfg)


def test_production_rejects_short_jwt_secret():
    cfg = _base_prod_settings(JWT_SECRET_KEY='short-secret')
    with pytest.raises(RuntimeError, match='at least 32 bytes'):
        validate_runtime_security(cfg)


def test_production_accepts_valid_secrets():
    cfg = _base_prod_settings()
    validate_runtime_security(cfg)


def test_production_rejects_placeholder_postgres_password():
    cfg = _base_prod_settings(POSTGRES_PASSWORD='change_me')
    with pytest.raises(RuntimeError, match='POSTGRES_PASSWORD'):
        validate_runtime_security(cfg)


def test_local_and_test_keep_dev_behavior():
    local_cfg = Settings(APP_ENV='local', JWT_SECRET_KEY='change_me', POSTGRES_PASSWORD='change_me')
    test_cfg = Settings(APP_ENV='test', JWT_SECRET_KEY='short', POSTGRES_PASSWORD='change_me')
    validate_runtime_security(local_cfg)
    validate_runtime_security(test_cfg)


def test_production_rejects_cors_wildcard():
    cfg = _base_prod_settings(CORS_ALLOWED_ORIGINS='*')
    with pytest.raises(RuntimeError, match='wildcard'):
        validate_runtime_security(cfg)
