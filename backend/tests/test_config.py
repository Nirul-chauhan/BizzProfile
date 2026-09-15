import os
import pytest
from pydantic import ValidationError


REQUIRED_ENV = {
    "DATABASE_URL": "postgresql://user:pass@localhost:5432/testdb",
    "SECRET_KEY": "test-secret-key-for-testing-only",
}


class TestSettingsDefaults:
    """Tests for Settings loading with valid configuration."""

    def test_loads_with_valid_env(self, set_env):
        set_env(**REQUIRED_ENV)
        from app.config import Settings
        settings = Settings()
        assert settings.DATABASE_URL == REQUIRED_ENV["DATABASE_URL"]
        assert settings.SECRET_KEY == REQUIRED_ENV["SECRET_KEY"]

    def test_app_name_default(self, set_env):
        set_env(**REQUIRED_ENV)
        from app.config import Settings
        settings = Settings()
        assert settings.APP_NAME == "BizzProfile"

    def test_jwt_algorithm_default(self, set_env):
        set_env(**REQUIRED_ENV)
        from app.config import Settings
        settings = Settings()
        assert settings.JWT_ALGORITHM == "HS256"

    def test_access_token_expire_minutes_default(self, set_env):
        set_env(**REQUIRED_ENV)
        from app.config import Settings
        settings = Settings()
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 60

    def test_otp_expire_minutes_default(self, set_env):
        set_env(**REQUIRED_ENV)
        from app.config import Settings
        settings = Settings()
        assert settings.OTP_EXPIRE_MINUTES == 5

    def test_cors_origins_default(self, set_env):
        set_env(**REQUIRED_ENV)
        from app.config import Settings
        settings = Settings()
        assert settings.CORS_ORIGINS == "http://localhost:5173"

    def test_db_pool_defaults(self, set_env):
        set_env(**REQUIRED_ENV)
        from app.config import Settings
        settings = Settings()
        assert settings.DB_POOL_SIZE == 5
        assert settings.DB_MAX_OVERFLOW == 10
        assert settings.DB_POOL_TIMEOUT == 30
        assert settings.DB_POOL_RECYCLE == 1800


class TestRequiredFields:
    """Tests that startup fails when required configuration is missing."""

    def _make_settings(self, **env_overrides):
        from app.config import Settings
        return Settings.model_validate(
            os.environ,
            _env_file=None,
        )

    def test_database_url_required(self, set_env):
        set_env(**{k: v for k, v in REQUIRED_ENV.items() if k != "DATABASE_URL"})
        os.environ.pop("DATABASE_URL", None)
        with pytest.raises(ValidationError) as exc_info:
            self._make_settings()
        assert "DATABASE_URL" in str(exc_info.value)

    def test_secret_key_required(self, set_env):
        set_env(**{k: v for k, v in REQUIRED_ENV.items() if k != "SECRET_KEY"})
        os.environ.pop("SECRET_KEY", None)
        with pytest.raises(ValidationError) as exc_info:
            self._make_settings()
        assert "SECRET_KEY" in str(exc_info.value)

    def test_both_required_fields_missing(self, set_env):
        os.environ.pop("DATABASE_URL", None)
        os.environ.pop("SECRET_KEY", None)
        with pytest.raises(ValidationError) as exc_info:
            self._make_settings()
        errors = str(exc_info.value)
        assert "DATABASE_URL" in errors
        assert "SECRET_KEY" in errors


class TestCorsOrigins:
    """Tests for CORS origin parsing."""

    def test_single_origin(self, set_env):
        set_env(**REQUIRED_ENV, CORS_ORIGINS="http://localhost:5173")
        from app.config import Settings
        settings = Settings()
        assert settings.cors_origin_list == ["http://localhost:5173"]

    def test_multiple_origins(self, set_env):
        set_env(**REQUIRED_ENV, CORS_ORIGINS="http://localhost:5173,https://example.com")
        from app.config import Settings
        settings = Settings()
        assert settings.cors_origin_list == ["http://localhost:5173", "https://example.com"]

    def test_whitespace_stripped(self, set_env):
        set_env(**REQUIRED_ENV, CORS_ORIGINS=" http://localhost:5173 , https://example.com ")
        from app.config import Settings
        settings = Settings()
        assert settings.cors_origin_list == ["http://localhost:5173", "https://example.com"]


class TestExtraFieldsIgnored:
    """Unknown environment variables are silently ignored."""

    def test_extra_var_ignored(self, set_env):
        set_env(**REQUIRED_ENV, SOME_RANDOM_VAR="should_be_ignored")
        from app.config import Settings
        settings = Settings()
        assert not hasattr(settings, "SOME_RANDOM_VAR")


class TestHealthEndpoint:
    """FastAPI /health endpoint returns correct response."""

    def test_health_returns_ok(self, set_env):
        set_env(**REQUIRED_ENV)
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["app"] == "BizzProfile"


class TestApiHealthEndpoint:
    """FastAPI /api/health endpoint with database check."""

    def test_api_health_returns_ok(self, set_env):
        set_env(**REQUIRED_ENV)
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ("ok", "degraded")
        assert data["app"] == "BizzProfile"
        assert "database" in data
        assert "status" in data["database"]

    def test_api_health_db_error_when_unreachable(self, set_env):
        set_env(
            DATABASE_URL="postgresql://user:pass@localhost:1/nonexistent",
            SECRET_KEY="test",
        )
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["database"]["status"] == "error"
        assert "detail" in data["database"]


class TestDatabaseModule:
    """Tests for database module components."""

    def test_base_is_declarative(self, set_env):
        set_env(**REQUIRED_ENV)
        from app.database import Base
        from sqlalchemy.orm import DeclarativeBase
        assert issubclass(Base, DeclarativeBase)

    def test_engine_created(self, set_env):
        set_env(**REQUIRED_ENV)
        from app.database import engine
        assert engine is not None
        assert engine.pool.size() >= 0

    def test_session_local_created(self, set_env):
        set_env(**REQUIRED_ENV)
        from app.database import SessionLocal
        assert SessionLocal is not None

    def test_check_db_health_returns_dict(self, set_env):
        set_env(**REQUIRED_ENV)
        from app.database import check_db_health
        result = check_db_health()
        assert isinstance(result, dict)
        assert "status" in result
        assert result["status"] in ("ok", "error")


class TestCorsMiddleware:
    """CORS middleware responds correctly to requests."""

    def test_cors_headers_present(self, set_env):
        set_env(**REQUIRED_ENV, CORS_ORIGINS="http://localhost:5173")
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)
        response = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "http://localhost:5173"

    def test_cors_rejects_unknown_origin(self, set_env):
        set_env(**REQUIRED_ENV, CORS_ORIGINS="http://localhost:5173")
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)
        response = client.options(
            "/health",
            headers={
                "Origin": "http://evil.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert "access-control-allow-origin" not in response.headers
