import os
import sys
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.services.password import hash_password, verify_password
from app.services.jwt import (
    AuthError,
    InvalidTokenError,
    TokenExpiredError,
    create_access_token,
    decode_access_token,
)


@pytest.fixture(scope="module")
def engine():
    eng = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture()
def db(engine):
    connection = engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def admin_role(db):
    role = Role(name="ADMIN", description="Administrator")
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@pytest.fixture()
def user_role(db):
    role = Role(name="USER", description="Standard user")
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@pytest.fixture()
def admin_user(db, admin_role):
    user = User(
        role_id=admin_role.id,
        full_name="Admin User",
        email="admin@example.com",
        password_hash=hash_password("AdminPass123!"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def regular_user(db, user_role):
    user = User(
        role_id=user_role.id,
        full_name="Regular User",
        email="user@example.com",
        password_hash=hash_password("UserPass123!"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def inactive_user(db, user_role):
    user = User(
        role_id=user_role.id,
        full_name="Inactive User",
        email="inactive@example.com",
        password_hash=hash_password("InactivePass123!"),
        is_active=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ---- Password Hashing Tests ----


class TestPasswordHashing:
    def test_hash_returns_string(self):
        result = hash_password("mypassword")
        assert isinstance(result, str)

    def test_hash_not_plaintext(self):
        result = hash_password("mypassword")
        assert result != "mypassword"

    def test_verify_correct_password(self):
        hashed = hash_password("mypassword")
        assert verify_password("mypassword", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("mypassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_same_password_different_hashes(self):
        h1 = hash_password("mypassword")
        h2 = hash_password("mypassword")
        assert h1 != h2

    def test_verify_empty_string(self):
        hashed = hash_password("")
        assert verify_password("", hashed) is True


# ---- JWT Tests ----


class TestJWT:
    def test_create_access_token(self, set_env):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
        )
        token = create_access_token(user_id=1, role_name="USER")
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_valid_token(self, set_env):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
        )
        token = create_access_token(user_id=42, role_name="ADMIN")
        payload = decode_access_token(token)
        assert payload["sub"] == "42"
        assert payload["role"] == "ADMIN"

    def test_decode_expired_token(self, set_env):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
            ACCESS_TOKEN_EXPIRE_MINUTES="-1",
        )
        token = create_access_token(user_id=1, role_name="USER")
        with pytest.raises(TokenExpiredError):
            decode_access_token(token)

    def test_decode_invalid_token(self, set_env):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
        )
        with pytest.raises(InvalidTokenError):
            decode_access_token("invalid.token.value")

    def test_decode_wrong_secret(self, set_env):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
        )
        token = create_access_token(user_id=1, role_name="USER")
        set_env(SECRET_KEY="different-secret")
        with pytest.raises(InvalidTokenError):
            decode_access_token(token)

    def test_token_contains_sub(self, set_env):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
        )
        token = create_access_token(user_id=99, role_name="USER")
        payload = decode_access_token(token)
        assert "sub" in payload
        assert "exp" in payload
        assert "iat" in payload

    def test_sub_is_string(self, set_env):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
        )
        token = create_access_token(user_id=1, role_name="USER")
        payload = decode_access_token(token)
        assert isinstance(payload["sub"], str)


# ---- Auth Dependencies Tests ----


class TestGetCurrentUser:
    def test_valid_token(self, set_env, db, regular_user):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
        )
        from app.dependencies.auth import get_current_user

        token = create_access_token(user_id=regular_user.id, role_name="USER")
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        result = get_current_user(credentials=credentials, db=db)
        assert result.id == regular_user.id

    def test_invalid_token_raises_401(self, set_env, db):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
        )
        from app.dependencies.auth import get_current_user

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="invalid-token"
        )
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials=credentials, db=db)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    def test_expired_token_raises_401(self, set_env, db, regular_user):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
            ACCESS_TOKEN_EXPIRE_MINUTES="-1",
        )
        from app.dependencies.auth import get_current_user

        token = create_access_token(user_id=regular_user.id, role_name="USER")
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials=credentials, db=db)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    def test_inactive_user_raises_403(self, set_env, db, inactive_user):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
        )
        from app.dependencies.auth import get_current_user

        token = create_access_token(user_id=inactive_user.id, role_name="USER")
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials=credentials, db=db)
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN


class TestRequireAdmin:
    def test_admin_passes(self, set_env, db, admin_user):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
        )
        from app.dependencies.auth import get_current_user, require_admin

        token = create_access_token(user_id=admin_user.id, role_name="ADMIN")
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user = get_current_user(credentials=credentials, db=db)
        result = require_admin(current_user=user)
        assert result.id == admin_user.id

    def test_non_admin_raises_403(self, set_env, db, regular_user):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
        )
        from app.dependencies.auth import get_current_user, require_admin

        token = create_access_token(user_id=regular_user.id, role_name="USER")
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user = get_current_user(credentials=credentials, db=db)
        with pytest.raises(HTTPException) as exc_info:
            require_admin(current_user=user)
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN


class TestRequireUser:
    def test_any_authenticated_user_passes(self, set_env, db, regular_user):
        set_env(
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="test-secret",
        )
        from app.dependencies.auth import get_current_user, require_user

        token = create_access_token(user_id=regular_user.id, role_name="USER")
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user = get_current_user(credentials=credentials, db=db)
        result = require_user(current_user=user)
        assert result.id == regular_user.id
