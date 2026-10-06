import os
import pytest
from pydantic import ValidationError


REQUIRED_ENV = {
    "DATABASE_URL": "postgresql://user:pass@localhost:5432/testdb",
    "SECRET_KEY": "test-secret-key-for-testing-only",
}


@pytest.fixture(autouse=True)
def _clean_settings_cache():
    """Clear lru_cache before each test so Settings is reloaded."""
    from app.config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def set_env():
    """Set environment variables for a test, restoring originals after."""
    original = {}

    def _set(**kwargs):
        from app.config import get_settings
        for key, value in kwargs.items():
            original[key] = os.environ.get(key)
            os.environ[key] = str(value)
        # get_settings() is lru_cached, so a value set earlier in the same
        # test would otherwise be served from the cache.
        get_settings.cache_clear()

    yield _set

    from app.config import get_settings
    for key, value in original.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value
    get_settings.cache_clear()


@pytest.fixture
def no_env_file():
    """Temporarily disable .env file loading by clearing DATABASE_URL."""
    os.environ.pop("DATABASE_URL", None)
    os.environ.pop("SECRET_KEY", None)
    yield
