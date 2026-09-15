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
from app.models.biz_profile import BizProfile, CompanyProfile
from app.models.category import Category, Subcategory
from app.models.role import Role, RoleEnum
from app.models.social_link import SocialLink
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
def user_role(db):
    role = Role(name=RoleEnum.USER.value, description="Standard user")
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


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


@pytest.fixture()
def test_subcategory(db, test_category):
    sub = Subcategory(name="Software", slug="software", category_id=test_category.id)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


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
        "company_detail": overrides.get("company_detail", {"legal_name": "Test Legal"}),
    }
    data.update(overrides)
    return client.post(
        "/api/profiles",
        json=data,
        headers=_auth(token),
    )


class TestPublicProfile:
    def test_public_profile_returns_200(self, client, user_one, test_category, test_subcategory):
        token = _login(client, "user1@example.com", "User1Pass123!")
        _create_profile(
            client, token,
            category_id=test_category.id,
            subcategory_id=test_subcategory.id,
            business_name="Public Biz",
            slug="public-biz",
            is_public=True,
            phone="+1234567890",
            email="contact@publicbiz.com",
            website="https://publicbiz.com",
            city="Mumbai",
            state="Maharashtra",
            country="India",
        )
        resp = client.get("/api/public/profiles/public-biz")
        assert resp.status_code == 200
        data = resp.json()
        assert data["business_name"] == "Public Biz"
        assert data["slug"] == "public-biz"
        assert data["phone"] == "+1234567890"
        assert data["email"] == "contact@publicbiz.com"
        assert data["website"] == "https://publicbiz.com"
        assert data["city"] == "Mumbai"
        assert data["state"] == "Maharashtra"
        assert data["country"] == "India"
        assert data["category"]["name"] == "Technology"
        assert data["subcategory"]["name"] == "Software"
        assert data["profile_type"] == "COMPANY"
        assert data["is_verified"] is False

    def test_public_profile_includes_social_links(self, client, user_one, test_category, db):
        token = _login(client, "user1@example.com", "User1Pass123!")
        _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Social Biz",
            slug="social-biz",
            is_public=True,
        )
        profile = db.query(BizProfile).filter(BizProfile.slug == "social-biz").first()
        sl1 = SocialLink(biz_profile_id=profile.id, platform="INSTAGRAM", url="https://instagram.com/socialbiz")
        sl2 = SocialLink(biz_profile_id=profile.id, platform="LINKEDIN", url="https://linkedin.com/company/socialbiz")
        db.add_all([sl1, sl2])
        db.commit()

        resp = client.get("/api/public/profiles/social-biz")
        assert resp.status_code == 200
        links = resp.json()["social_links"]
        assert len(links) == 2
        platforms = {l["platform"] for l in links}
        assert platforms == {"INSTAGRAM", "LINKEDIN"}

    def test_public_profile_includes_company_detail(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Company Biz",
            slug="company-biz",
            is_public=True,
            company_detail={
                "company_registration_number": "CORP123",
                "legal_name": "Company Legal",
                "company_type": "Private Limited",
            },
        )
        resp = client.get("/api/public/profiles/company-biz")
        assert resp.status_code == 200
        detail = resp.json()["company_detail"]
        assert detail["company_registration_number"] == "CORP123"
        assert detail["legal_name"] == "Company Legal"
        assert detail["company_type"] == "Private Limited"

    def test_public_profile_excludes_private_fields(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Private Check",
            slug="private-check",
            is_public=True,
        )
        resp = client.get("/api/public/profiles/private-check")
        assert resp.status_code == 200
        data = resp.json()
        assert "user_id" not in data
        assert "is_active" not in data
        assert "is_public" not in data
        assert "updated_at" not in data

    def test_private_profile_returns_404(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Hidden Biz",
            slug="hidden-biz",
            is_public=False,
        )
        resp = client.get("/api/public/profiles/hidden-biz")
        assert resp.status_code == 404

    def test_inactive_profile_returns_404(self, client, user_one, test_category, db):
        token = _login(client, "user1@example.com", "User1Pass123!")
        _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Inactive Biz",
            slug="inactive-biz",
            is_public=True,
        )
        profile = db.query(BizProfile).filter(BizProfile.slug == "inactive-biz").first()
        profile.is_active = False
        db.commit()

        resp = client.get("/api/public/profiles/inactive-biz")
        assert resp.status_code == 404

    def test_nonexistent_profile_returns_404(self, client):
        resp = client.get("/api/public/profiles/does-not-exist")
        assert resp.status_code == 404

    def test_no_authentication_required(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Open Biz",
            slug="open-biz",
            is_public=True,
        )
        resp = client.get("/api/public/profiles/open-biz")
        assert resp.status_code == 200

    def test_public_profile_with_location(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Location Biz",
            slug="location-biz",
            is_public=True,
            address="123 Main St",
            city="Bangalore",
            state="Karnataka",
            country="India",
            pincode="560001",
            latitude=12.9716,
            longitude=77.5946,
        )
        resp = client.get("/api/public/profiles/location-biz")
        assert resp.status_code == 200
        data = resp.json()
        assert data["address"] == "123 Main St"
        assert data["city"] == "Bangalore"
        assert data["state"] == "Karnataka"
        assert data["country"] == "India"
        assert data["pincode"] == "560001"
        assert data["latitude"] == 12.9716
        assert data["longitude"] == 77.5946

    def test_public_profile_with_logo_and_cover(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        _create_profile(
            client, token,
            category_id=test_category.id,
            business_name="Image Biz",
            slug="image-biz",
            is_public=True,
            logo_url="https://example.com/logo.png",
            cover_image_url="https://example.com/cover.jpg",
        )
        resp = client.get("/api/public/profiles/image-biz")
        assert resp.status_code == 200
        data = resp.json()
        assert data["logo_url"] == "https://example.com/logo.png"
        assert data["cover_image_url"] == "https://example.com/cover.jpg"

    def test_other_users_private_profile_hidden(self, client, user_one, user_two, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        _create_profile(
            client, token1,
            category_id=test_category.id,
            business_name="Secret Biz",
            slug="secret-biz",
            is_public=False,
        )
        resp = client.get("/api/public/profiles/secret-biz")
        assert resp.status_code == 404
