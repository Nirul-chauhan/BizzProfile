import os
import sys

import pytest
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
    role = db.query(Role).filter(Role.name == RoleEnum.ADMIN.value).first()
    if not role:
        role = Role(name=RoleEnum.ADMIN.value, description="Administrator")
        db.add(role)
        db.commit()
        db.refresh(role)
    return role


@pytest.fixture()
def user_role(db):
    role = db.query(Role).filter(Role.name == RoleEnum.USER.value).first()
    if not role:
        role = Role(name=RoleEnum.USER.value, description="Standard user")
        db.add(role)
        db.commit()
        db.refresh(role)
    return role


@pytest.fixture()
def admin_user(db, admin_role):
    existing = db.query(User).filter(User.email == "admin@example.com").first()
    if existing:
        return existing
    user = User(
        role_id=admin_role.id,
        full_name="Admin User",
        email="admin@example.com",
        password_hash=hash_password("AdminPass123!"),
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def regular_user(db, user_role):
    existing = db.query(User).filter(User.email == "user@example.com").first()
    if existing:
        return existing
    user = User(
        role_id=user_role.id,
        full_name="Regular User",
        email="user@example.com",
        password_hash=hash_password("UserPass123!"),
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _admin_token(client, admin_user):
    resp = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "AdminPass123!"},
    )
    return resp.json()["access_token"]


def _user_token(client, regular_user):
    resp = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "UserPass123!"},
    )
    return resp.json()["access_token"]


# ---- Public API Tests ----


class TestPublicCategories:
    def test_list_categories_empty(self, client):
        resp = client.get("/api/categories")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_categories_with_data(self, client, admin_user):
        token = _admin_token(client, admin_user)
        client.post(
            "/api/admin/categories",
            json={"name": "Electronics", "slug": "electronics"},
            headers={"Authorization": f"Bearer {token}"},
        )
        resp = client.get("/api/categories")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_get_category_by_id(self, client, admin_user):
        token = _admin_token(client, admin_user)
        create_resp = client.post(
            "/api/admin/categories",
            json={"name": "Books", "slug": "books"},
            headers={"Authorization": f"Bearer {token}"},
        )
        cat_id = create_resp.json()["id"]
        resp = client.get(f"/api/categories/{cat_id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Books"

    def test_get_category_not_found(self, client):
        resp = client.get("/api/categories/9999")
        assert resp.status_code == 404


# ---- Admin Category Tests ----


class TestAdminCategories:
    def test_create_category(self, client, admin_user):
        token = _admin_token(client, admin_user)
        resp = client.post(
            "/api/admin/categories",
            json={"name": "Fashion", "slug": "fashion"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Fashion"
        assert data["slug"] == "fashion"
        assert data["is_active"] is True

    def test_create_category_duplicate_name(self, client, admin_user):
        token = _admin_token(client, admin_user)
        client.post(
            "/api/admin/categories",
            json={"name": "Sports", "slug": "sports"},
            headers={"Authorization": f"Bearer {token}"},
        )
        resp = client.post(
            "/api/admin/categories",
            json={"name": "Sports", "slug": "sports-2"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 400

    def test_create_category_unauthorized(self, client, regular_user):
        token = _user_token(client, regular_user)
        resp = client.post(
            "/api/admin/categories",
            json={"name": "Hacked", "slug": "hacked"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403

    def test_create_category_no_token(self, client):
        resp = client.post(
            "/api/admin/categories",
            json={"name": "Hacked", "slug": "hacked"},
        )
        assert resp.status_code == 401

    def test_update_category(self, client, admin_user):
        token = _admin_token(client, admin_user)
        create_resp = client.post(
            "/api/admin/categories",
            json={"name": "Old Name", "slug": "old-name"},
            headers={"Authorization": f"Bearer {token}"},
        )
        cat_id = create_resp.json()["id"]
        resp = client.put(
            f"/api/admin/categories/{cat_id}",
            json={"name": "New Name"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "New Name"

    def test_delete_category(self, client, admin_user):
        token = _admin_token(client, admin_user)
        create_resp = client.post(
            "/api/admin/categories",
            json={"name": "To Delete", "slug": "to-delete"},
            headers={"Authorization": f"Bearer {token}"},
        )
        cat_id = create_resp.json()["id"]
        resp = client.delete(
            f"/api/admin/categories/{cat_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 204

        get_resp = client.get(f"/api/categories/{cat_id}")
        assert get_resp.status_code == 404


# ---- Admin Subcategory Tests ----


class TestAdminSubcategories:
    def test_create_subcategory(self, client, admin_user):
        token = _admin_token(client, admin_user)
        cat_resp = client.post(
            "/api/admin/categories",
            json={"name": "Phones", "slug": "phones"},
            headers={"Authorization": f"Bearer {token}"},
        )
        cat_id = cat_resp.json()["id"]
        resp = client.post(
            f"/api/admin/categories/{cat_id}/subcategories",
            json={"name": "Smartphones", "slug": "smartphones"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == "Smartphones"
        assert resp.json()["category_id"] == cat_id

    def test_create_subcategory_duplicate_slug(self, client, admin_user):
        token = _admin_token(client, admin_user)
        cat_resp = client.post(
            "/api/admin/categories",
            json={"name": "Laptops", "slug": "laptops"},
            headers={"Authorization": f"Bearer {token}"},
        )
        cat_id = cat_resp.json()["id"]
        client.post(
            f"/api/admin/categories/{cat_id}/subcategories",
            json={"name": "Gaming", "slug": "gaming"},
            headers={"Authorization": f"Bearer {token}"},
        )
        resp = client.post(
            f"/api/admin/categories/{cat_id}/subcategories",
            json={"name": "Gaming 2", "slug": "gaming"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 400

    def test_create_subcategory_nonexistent_category(self, client, admin_user):
        token = _admin_token(client, admin_user)
        resp = client.post(
            "/api/admin/categories/9999/subcategories",
            json={"name": "Orphan", "slug": "orphan"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 400

    def test_update_subcategory(self, client, admin_user):
        token = _admin_token(client, admin_user)
        cat_resp = client.post(
            "/api/admin/categories",
            json={"name": "Tablets", "slug": "tablets"},
            headers={"Authorization": f"Bearer {token}"},
        )
        cat_id = cat_resp.json()["id"]
        sub_resp = client.post(
            f"/api/admin/categories/{cat_id}/subcategories",
            json={"name": "iPads", "slug": "ipads"},
            headers={"Authorization": f"Bearer {token}"},
        )
        sub_id = sub_resp.json()["id"]
        resp = client.put(
            f"/api/admin/subcategories/{sub_id}",
            json={"name": "Apple Tablets"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Apple Tablets"

    def test_delete_subcategory(self, client, admin_user):
        token = _admin_token(client, admin_user)
        cat_resp = client.post(
            "/api/admin/categories",
            json={"name": "Cameras", "slug": "cameras"},
            headers={"Authorization": f"Bearer {token}"},
        )
        cat_id = cat_resp.json()["id"]
        sub_resp = client.post(
            f"/api/admin/categories/{cat_id}/subcategories",
            json={"name": "DSLR", "slug": "dslr"},
            headers={"Authorization": f"Bearer {token}"},
        )
        sub_id = sub_resp.json()["id"]
        resp = client.delete(
            f"/api/admin/subcategories/{sub_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 204


# ---- Public Subcategory Tests ----


class TestPublicSubcategories:
    def test_list_subcategories(self, client, admin_user):
        token = _admin_token(client, admin_user)
        cat_resp = client.post(
            "/api/admin/categories",
            json={"name": "Food", "slug": "food"},
            headers={"Authorization": f"Bearer {token}"},
        )
        cat_id = cat_resp.json()["id"]
        client.post(
            f"/api/admin/categories/{cat_id}/subcategories",
            json={"name": "Snacks", "slug": "snacks"},
            headers={"Authorization": f"Bearer {token}"},
        )
        resp = client.get(f"/api/categories/{cat_id}/subcategories")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_get_category_includes_subcategories(self, client, admin_user):
        token = _admin_token(client, admin_user)
        cat_resp = client.post(
            "/api/admin/categories",
            json={"name": "Drinks", "slug": "drinks"},
            headers={"Authorization": f"Bearer {token}"},
        )
        cat_id = cat_resp.json()["id"]
        client.post(
            f"/api/admin/categories/{cat_id}/subcategories",
            json={"name": "Soda", "slug": "soda"},
            headers={"Authorization": f"Bearer {token}"},
        )
        resp = client.get(f"/api/categories/{cat_id}")
        assert resp.status_code == 200
        assert len(resp.json()["subcategories"]) == 1
