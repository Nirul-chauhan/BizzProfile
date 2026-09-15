import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base, get_db
from app.main import app
from app.models.category import Category, Subcategory
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
def user_one(db, user_role):
    user = User(
        role_id=user_role.id,
        full_name="User One",
        email="user1@example.com",
        password_hash=hash_password("User1Pass123!"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def user_two(db, user_role):
    user = User(
        role_id=user_role.id,
        full_name="User Two",
        email="user2@example.com",
        password_hash=hash_password("User2Pass123!"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def test_category(db):
    cat = Category(name="Technology", slug="technology")
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def _login(client, email, password):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _create_profile(client, token, **overrides):
    data = {
        "category_id": overrides.get("category_id", 1),
        "profile_type": overrides.get("profile_type", "COMPANY"),
        "business_name": overrides.get("business_name", "Test Co"),
        "slug": overrides.get("slug", "test-co"),
    }
    data.update(overrides)
    return client.post(
        "/api/profiles",
        json=data,
        headers=_auth(token),
    )


# ---- Authorization Tests ----


class TestAuthAccess:
    def test_unauthenticated_cannot_create(self, client):
        resp = client.post("/api/profiles", json={"category_id": 1, "profile_type": "COMPANY", "business_name": "X", "slug": "x"})
        assert resp.status_code == 403

    def test_unauthenticated_cannot_list_my(self, client):
        resp = client.get("/api/profiles/my")
        assert resp.status_code == 403

    def test_unauthenticated_cannot_get_profile(self, client):
        resp = client.get("/api/profiles/1")
        assert resp.status_code == 403


class TestOwnerCanManage:
    def test_owner_creates_profile(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = _create_profile(client, token, category_id=test_category.id, business_name="My Biz", slug="my-biz")
        assert resp.status_code == 201
        assert resp.json()["user_id"] == user_one.id

    def test_owner_lists_own_profiles(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        _create_profile(client, token, category_id=test_category.id, business_name="List Biz", slug="list-biz")
        resp = client.get("/api/profiles/my", headers=_auth(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_owner_updates_own_profile(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        create_resp = _create_profile(client, token, category_id=test_category.id, business_name="Old Name", slug="old-name")
        profile_id = create_resp.json()["id"]
        resp = client.put(
            f"/api/profiles/{profile_id}",
            json={"business_name": "New Name"},
            headers=_auth(token),
        )
        assert resp.status_code == 200
        assert resp.json()["business_name"] == "New Name"

    def test_owner_deletes_own_profile(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        create_resp = _create_profile(client, token, category_id=test_category.id, business_name="Del Biz", slug="del-biz")
        profile_id = create_resp.json()["id"]
        resp = client.delete(f"/api/profiles/{profile_id}", headers=_auth(token))
        assert resp.status_code == 204


class TestCrossUserRestriction:
    def test_user_cannot_update_other_users_profile(self, client, user_one, user_two, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        token2 = _login(client, "user2@example.com", "User2Pass123!")
        create_resp = _create_profile(client, token1, category_id=test_category.id, business_name="User1 Biz", slug="user1-biz")
        profile_id = create_resp.json()["id"]
        resp = client.put(
            f"/api/profiles/{profile_id}",
            json={"business_name": "Hacked"},
            headers=_auth(token2),
        )
        assert resp.status_code == 400

    def test_user_cannot_delete_other_users_profile(self, client, user_one, user_two, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        token2 = _login(client, "user2@example.com", "User2Pass123!")
        create_resp = _create_profile(client, token1, category_id=test_category.id, business_name="No Del", slug="no-del")
        profile_id = create_resp.json()["id"]
        resp = client.delete(f"/api/profiles/{profile_id}", headers=_auth(token2))
        assert resp.status_code == 404


class TestAdminAccess:
    def test_admin_can_update_any_profile(self, client, admin_user, user_one, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        admin_token = _login(client, "admin@example.com", "AdminPass123!")
        create_resp = _create_profile(client, token1, category_id=test_category.id, business_name="Admin Edit", slug="admin-edit")
        profile_id = create_resp.json()["id"]
        resp = client.put(
            f"/api/profiles/{profile_id}",
            json={"business_name": "Admin Edited"},
            headers=_auth(admin_token),
        )
        assert resp.status_code == 200
        assert resp.json()["business_name"] == "Admin Edited"

    def test_admin_can_delete_any_profile(self, client, admin_user, user_one, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        admin_token = _login(client, "admin@example.com", "AdminPass123!")
        create_resp = _create_profile(client, token1, category_id=test_category.id, business_name="Admin Del", slug="admin-del")
        profile_id = create_resp.json()["id"]
        resp = client.delete(f"/api/profiles/{profile_id}", headers=_auth(admin_token))
        assert resp.status_code == 204


class TestValidation:
    def test_invalid_category(self, client, user_one):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = _create_profile(client, token, category_id=9999, business_name="Bad Cat", slug="bad-cat")
        assert resp.status_code == 400

    def test_invalid_profile_type(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = _create_profile(client, token, category_id=test_category.id, profile_type="INVALID", business_name="Bad Type", slug="bad-type")
        assert resp.status_code == 422

    def test_invalid_email_format(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Bad Email",
            slug="bad-email",
            email="not-an-email",
        )
        assert resp.status_code == 400

    def test_invalid_website_url(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Bad URL",
            slug="bad-url",
            website="ftp://invalid.com",
        )
        assert resp.status_code == 400

    def test_invalid_latitude(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Bad Lat",
            slug="bad-lat",
            latitude=999.0,
        )
        assert resp.status_code == 400

    def test_invalid_longitude(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Bad Lng",
            slug="bad-lng",
            longitude=999.0,
        )
        assert resp.status_code == 400

    def test_invalid_phone(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Bad Phone",
            slug="bad-phone",
            phone="12",
        )
        assert resp.status_code == 400

    def test_auto_generated_slug(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Auto Slug Co",
        )
        assert resp.status_code == 201
        assert resp.json()["slug"] == "auto-slug-co"

    def test_duplicate_slug_gets_counter(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        _create_profile(client, token, category_id=test_category.id, business_name="Dupe", slug="dupe-slug")
        resp = _create_profile(client, token, category_id=test_category.id, business_name="Dupe Two", slug="dupe-slug")
        assert resp.status_code == 201
        assert resp.json()["slug"] == "dupe-slug-1"
