import os
import sys
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base, get_db
from app.main import app
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.services.password import hash_password


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
def client(db, set_env):
    set_env(
        DATABASE_URL="sqlite:///:memory:",
        SECRET_KEY="test-secret-key-for-testing-only",
    )

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_role(db):
    role = Role(name=RoleEnum.ADMIN.value, description="Administrator")
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@pytest.fixture()
def user_role(db):
    role = Role(name=RoleEnum.USER.value, description="Standard user")
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@pytest.fixture()
def registered_user(client, user_role):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": "test@example.com",
            "password": "TestPass123!",
        },
    )
    assert response.status_code == 201
    return response.json()


class TestRegister:
    def test_register_success(self, client, user_role):
        response = client.post(
            "/api/auth/register",
            json={
                "full_name": "New User",
                "email": "new@example.com",
                "password": "NewPass123!",
            },
        )
        assert response.status_code == 201
        assert "message" in response.json()

    def test_register_duplicate_email(self, client, registered_user):
        response = client.post(
            "/api/auth/register",
            json={
                "full_name": "Duplicate User",
                "email": "test@example.com",
                "password": "DupPass123!",
            },
        )
        assert response.status_code == 400

    def test_register_invalid_email(self, client, user_role):
        response = client.post(
            "/api/auth/register",
            json={
                "full_name": "Bad Email",
                "email": "not-an-email",
                "password": "Pass123!",
            },
        )
        assert response.status_code == 422

    def test_register_short_password(self, client, user_role):
        response = client.post(
            "/api/auth/register",
            json={
                "full_name": "Short Pass",
                "email": "short@example.com",
                "password": "123",
            },
        )
        assert response.status_code == 422


class TestLogin:
    def test_login_success(self, client, registered_user):
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPass123!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data

    def test_login_wrong_password(self, client, registered_user):
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "WrongPass123!",
            },
        )
        assert response.status_code == 401

    def test_login_nonexistent_email(self, client, registered_user):
        response = client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "Pass123!",
            },
        )
        assert response.status_code == 401


class TestMe:
    def test_get_me_authenticated(self, client, registered_user):
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPass123!",
            },
        )
        token = login_response.json()["access_token"]

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"

    def test_get_me_unauthenticated(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 403


class TestOtp:
    def test_send_otp(self, client, registered_user):
        response = client.post(
            "/api/auth/send-otp",
            json={
                "email": "test@example.com",
                "purpose": "EMAIL_VERIFICATION",
            },
        )
        assert response.status_code == 200

    def test_send_otp_and_verify(self, client, registered_user, set_env):
        set_env(APP_ENV="development")
        send_response = client.post(
            "/api/auth/send-otp",
            json={
                "email": "test@example.com",
                "purpose": "EMAIL_VERIFICATION",
            },
        )
        assert send_response.status_code == 200

        otp_code = send_response.json().get("otp")
        if otp_code:
            verify_response = client.post(
                "/api/auth/verify-otp",
                json={
                    "email": "test@example.com",
                    "purpose": "EMAIL_VERIFICATION",
                    "otp": otp_code,
                },
            )
            assert verify_response.status_code == 200


class TestForgotPassword:
    def test_forgot_password_existing_email(self, client, registered_user, set_env):
        set_env(APP_ENV="development")
        response = client.post(
            "/api/auth/forgot-password",
            json={"email": "test@example.com"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "otp" in data

    def test_forgot_password_nonexistent_email(self, client, registered_user, set_env):
        set_env(APP_ENV="development")
        response = client.post(
            "/api/auth/forgot-password",
            json={"email": "nonexistent@example.com"},
        )
        assert response.status_code == 400


class TestResetPassword:
    def test_reset_password_flow(self, client, registered_user, set_env):
        set_env(APP_ENV="development")
        forgot_response = client.post(
            "/api/auth/forgot-password",
            json={"email": "test@example.com"},
        )
        assert forgot_response.status_code == 200
        code = forgot_response.json()["otp"]

        reset_response = client.post(
            "/api/auth/reset-password",
            json={
                "email": "test@example.com",
                "purpose": "FORGOT_PASSWORD",
                "otp": code,
                "new_password": "NewPassword123!",
            },
        )
        assert reset_response.status_code == 200

        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "NewPassword123!",
            },
        )
        assert login_response.status_code == 200
