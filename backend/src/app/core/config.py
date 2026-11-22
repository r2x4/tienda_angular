from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


INSECURE_SECRET_PLACEHOLDERS = {
    "change_me",
    "changeme",
    "change_me_jwt_secret_key_at_least_32_chars",
    "change_me_jwt_secret_key",
    "secret",
    "jwt_secret",
    "your-secret-key",
    "your_jwt_secret",
    "replace_me",
    "default",
}

SECURE_ENVIRONMENTS = {"production", "staging"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="tienda-angular-backend", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    postgres_host: str = Field(default="db", alias="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, alias="POSTGRES_PORT")
    postgres_db: str = Field(default="tienda_angular", alias="POSTGRES_DB")
    postgres_user: str = Field(default="tienda_user", alias="POSTGRES_USER")
    postgres_password: str = Field(default="change_me", alias="POSTGRES_PASSWORD")
    database_url: str = Field(
        default="postgresql+psycopg://tienda_user:change_me@db:5432/tienda_angular",
        alias="DATABASE_URL",
    )

    jwt_secret_key: str = Field(default="change_me_jwt_secret_key_at_least_32_chars", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")
    enable_auth_diagnostics: bool = Field(default=False, alias="ENABLE_AUTH_DIAGNOSTICS")

    cors_allowed_origins: str = Field(default="http://localhost:4200", alias="CORS_ALLOWED_ORIGINS")
    cors_allow_credentials: bool = Field(default=False, alias="CORS_ALLOW_CREDENTIALS")
    cors_allowed_methods: str = Field(default="GET,POST,PUT,PATCH,DELETE,OPTIONS", alias="CORS_ALLOWED_METHODS")
    cors_allowed_headers: str = Field(
        default="Authorization,Content-Type,Accept,Origin,X-Requested-With",
        alias="CORS_ALLOWED_HEADERS",
    )

    auth_rate_limit_login_limit: int = Field(default=10, alias="AUTH_RATE_LIMIT_LOGIN_LIMIT")
    auth_rate_limit_login_window_seconds: int = Field(default=60, alias="AUTH_RATE_LIMIT_LOGIN_WINDOW_SECONDS")
    auth_rate_limit_login_block_seconds: int = Field(default=300, alias="AUTH_RATE_LIMIT_LOGIN_BLOCK_SECONDS")
    auth_rate_limit_register_limit: int = Field(default=5, alias="AUTH_RATE_LIMIT_REGISTER_LIMIT")
    auth_rate_limit_register_window_seconds: int = Field(default=60, alias="AUTH_RATE_LIMIT_REGISTER_WINDOW_SECONDS")
    auth_rate_limit_register_block_seconds: int = Field(default=300, alias="AUTH_RATE_LIMIT_REGISTER_BLOCK_SECONDS")
    auth_rate_limit_refresh_limit: int = Field(default=20, alias="AUTH_RATE_LIMIT_REFRESH_LIMIT")
    auth_rate_limit_refresh_window_seconds: int = Field(default=60, alias="AUTH_RATE_LIMIT_REFRESH_WINDOW_SECONDS")
    auth_rate_limit_refresh_block_seconds: int = Field(default=300, alias="AUTH_RATE_LIMIT_REFRESH_BLOCK_SECONDS")

    @property
    def is_secure_environment(self) -> bool:
        return self.app_env.strip().lower() in SECURE_ENVIRONMENTS

    def cors_origins_list(self) -> list[str]:
        origins = [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]
        return origins


def _is_placeholder_secret(value: str) -> bool:
    normalized = value.strip().lower()
    return normalized in INSECURE_SECRET_PLACEHOLDERS


def validate_runtime_security(cfg: "Settings") -> None:
    """Validate security-sensitive settings before serving requests.

    In production/staging, rejects insecure secrets/placeholders. Never logs or exposes
    secret values in error messages.
    """
    env = cfg.app_env.strip().lower()
    if env not in SECURE_ENVIRONMENTS:
        return

    jwt_secret = cfg.jwt_secret_key or ""
    if not jwt_secret.strip():
        raise RuntimeError("Insecure configuration: JWT_SECRET_KEY must be set in production/staging.")
    if _is_placeholder_secret(jwt_secret):
        raise RuntimeError("Insecure configuration: JWT_SECRET_KEY uses a placeholder/default value.")
    if len(jwt_secret.encode("utf-8")) < 32:
        raise RuntimeError("Insecure configuration: JWT_SECRET_KEY must be at least 32 bytes.")

    pg_password = cfg.postgres_password or ""
    if not pg_password.strip():
        raise RuntimeError("Insecure configuration: POSTGRES_PASSWORD must be set in production/staging.")
    if _is_placeholder_secret(pg_password):
        raise RuntimeError("Insecure configuration: POSTGRES_PASSWORD uses a placeholder/default value.")

    origins = cfg.cors_origins_list()
    if any(o == "*" for o in origins):
        raise RuntimeError("Insecure configuration: CORS wildcard origin is not allowed in production/staging.")
    if cfg.cors_allow_credentials and any(o == "*" for o in origins):
        raise RuntimeError("Insecure configuration: CORS allow_credentials cannot be combined with wildcard origin.")


settings = Settings()
