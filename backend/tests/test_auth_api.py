import os
import sys
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base
from app.dependencies.database import get_db_session
from app.main import app
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.services.password import hash_password

_reg_counter = 0


@pytest.fixture(scope="module")
def engine():
    eng = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture()
def db(engine):
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture()
def client(db, set_env):
    set_env(
        DATABASE_URL="sqlite:///:memory:",
        SECRET_KEY="test-secret-key-for-testing-only",
    )

    def override_get_db_session():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db_session] = override_get_db_session
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
    role = db.query(Role).filter(Role.name == RoleEnum.CUSTOMER.value).first()
    if not role:
        role = Role(name=RoleEnum.CUSTOMER.value, description="Customer (Buyer)")
        db.add(role)
        db.commit()
        db.refresh(role)
    return role


@pytest.fixture()
def registered_user(client, user_role):
    global _reg_counter
    _reg_counter += 1
    email = f"testuser{_reg_counter}@example.com"
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": email,
            "password": "TestPass123!",
        },
    )
    assert response.status_code == 201
    data = response.json()
    data["email"] = email
    return data


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
                "email": registered_user["email"],
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
                "email": registered_user["email"],
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
                "email": registered_user["email"],
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
                "email": registered_user["email"],
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
        assert data["email"] == registered_user["email"]

    def test_get_me_unauthenticated(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code in (401, 403)


class TestOtp:
    def test_send_otp(self, client, registered_user):
        response = client.post(
            "/api/auth/send-otp",
            json={
                "email": registered_user["email"],
                "purpose": "EMAIL_VERIFICATION",
            },
        )
        assert response.status_code == 200

    def test_send_otp_and_verify(self, client, registered_user, set_env):
        set_env(APP_ENV="development")
        send_response = client.post(
            "/api/auth/send-otp",
            json={
                "email": registered_user["email"],
                "purpose": "EMAIL_VERIFICATION",
            },
        )
        assert send_response.status_code == 200

        otp_code = send_response.json().get("otp")
        if otp_code:
            verify_response = client.post(
                "/api/auth/verify-otp",
                json={
                    "email": registered_user["email"],
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
            json={"email": registered_user["email"]},
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
            json={"email": registered_user["email"]},
        )
        assert forgot_response.status_code == 200
        code = forgot_response.json()["otp"]

        reset_response = client.post(
            "/api/auth/reset-password",
            json={
                "email": registered_user["email"],
                "purpose": "FORGOT_PASSWORD",
                "otp": code,
                "new_password": "NewPassword123!",
            },
        )
        assert reset_response.status_code == 200

        login_response = client.post(
            "/api/auth/login",
            json={
                "email": registered_user["email"],
                "password": "NewPassword123!",
            },
        )
        assert login_response.status_code == 200
