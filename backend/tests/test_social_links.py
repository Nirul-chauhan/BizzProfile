import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base, get_db
from app.dependencies.database import get_db_session
from app.main import app
from app.models.category import Category, Subcategory
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.services.password import hash_password


# ---- Fixtures ----


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

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db_session] = override_get_db
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


# ---- Helpers ----


def _login(client, email, password):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _create_profile(client, token, **overrides):
    data = {
        "category_id": overrides.get("category_id", 1),
        "profile_type": overrides.get("profile_type", "INDIVIDUAL"),
        "business_name": overrides.get("business_name", "Test Co"),
        "slug": overrides.get("slug", "test-co"),
    }
    data.update(overrides)
    if "company_detail" not in data and data["profile_type"] == "COMPANY":
        data["company_detail"] = {}
    if "individual_detail" not in data and data["profile_type"] == "INDIVIDUAL":
        data["individual_detail"] = {}
    if "msme_detail" not in data and data["profile_type"] == "MSME":
        data["msme_detail"] = {}
    return client.post(
        "/api/profiles",
        json=data,
        headers=_auth(token),
    )


def _add_social_link(client, token, profile_id, platform, url):
    return client.post(
        f"/api/profiles/{profile_id}/social-links",
        json={"platform": platform, "url": url},
        headers=_auth(token),
    )


# ---- Tests: Authentication ----


class TestSocialLinkAuth:
    def test_unauthenticated_cannot_create(self, client):
        resp = client.post(
            "/api/profiles/1/social-links",
            json={"platform": "INSTAGRAM", "url": "https://instagram.com/test"},
        )
        assert resp.status_code == 401

    def test_unauthenticated_cannot_list(self, client):
        resp = client.get("/api/profiles/1/social-links")
        assert resp.status_code == 401

    def test_unauthenticated_cannot_update(self, client):
        resp = client.put(
            "/api/social-links/1",
            json={"url": "https://updated.com"},
        )
        assert resp.status_code == 401

    def test_unauthenticated_cannot_delete(self, client):
        resp = client.delete("/api/social-links/1")
        assert resp.status_code == 401


# ---- Tests: Create ----


class TestCreateSocialLink:
    def test_owner_can_create_social_link(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="Biz", slug="biz"
        )
        profile_id = profile_resp.json()["id"]
        resp = _add_social_link(
            client, token, profile_id, "INSTAGRAM", "https://instagram.com/mybiz"
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["platform"] == "INSTAGRAM"
        assert data["url"] == "https://instagram.com/mybiz"
        assert data["biz_profile_id"] == profile_id

    def test_create_all_platforms(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="Multi", slug="multi"
        )
        profile_id = profile_resp.json()["id"]

        platforms = {
            "INSTAGRAM": "https://instagram.com/test",
            "FACEBOOK": "https://facebook.com/test",
            "LINKEDIN": "https://linkedin.com/in/test",
            "YOUTUBE": "https://youtube.com/@test",
            "X": "https://x.com/test",
            "WEBSITE": "https://test.com",
        }
        for platform, url in platforms.items():
            resp = _add_social_link(client, token, profile_id, platform, url)
            assert resp.status_code == 201, f"Failed to create {platform}: {resp.json()}"

    def test_cannot_duplicate_platform(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="Dupe", slug="dupe"
        )
        profile_id = profile_resp.json()["id"]
        _add_social_link(client, token, profile_id, "INSTAGRAM", "https://instagram.com/first")
        resp = _add_social_link(
            client, token, profile_id, "INSTAGRAM", "https://instagram.com/second"
        )
        assert resp.status_code == 400
        assert "already exists" in resp.json()["detail"]

    def test_invalid_platform_rejected(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="Bad", slug="bad"
        )
        profile_id = profile_resp.json()["id"]
        resp = client.post(
            f"/api/profiles/{profile_id}/social-links",
            json={"platform": "TIKTOK", "url": "https://tiktok.com/@test"},
            headers=_auth(token),
        )
        assert resp.status_code == 422

    def test_invalid_url_rejected(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="BadUrl", slug="bad-url"
        )
        profile_id = profile_resp.json()["id"]
        resp = _add_social_link(
            client, token, profile_id, "INSTAGRAM", "not-a-url"
        )
        assert resp.status_code == 422

    def test_ftp_url_rejected(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="FtpBiz", slug="ftp-biz"
        )
        profile_id = profile_resp.json()["id"]
        resp = _add_social_link(
            client, token, profile_id, "WEBSITE", "ftp://files.example.com"
        )
        assert resp.status_code == 422

    def test_nonexistent_profile_returns_400(self, client, user_one):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = _add_social_link(client, token, 99999, "INSTAGRAM", "https://instagram.com/test")
        assert resp.status_code == 400
        assert "not found" in resp.json()["detail"]


# ---- Tests: List ----


class TestListSocialLinks:
    def test_list_links(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="ListBiz", slug="list-biz"
        )
        profile_id = profile_resp.json()["id"]
        _add_social_link(client, token, profile_id, "INSTAGRAM", "https://instagram.com/test")
        _add_social_link(client, token, profile_id, "FACEBOOK", "https://facebook.com/test")

        resp = client.get(f"/api/profiles/{profile_id}/social-links", headers=_auth(token))
        assert resp.status_code == 200
        links = resp.json()
        assert len(links) == 2
        platforms = [l["platform"] for l in links]
        assert "INSTAGRAM" in platforms
        assert "FACEBOOK" in platforms

    def test_list_empty_when_no_links(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="EmptyBiz", slug="empty-biz"
        )
        profile_id = profile_resp.json()["id"]
        resp = client.get(f"/api/profiles/{profile_id}/social-links", headers=_auth(token))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_nonexistent_profile_returns_404(self, client, user_one):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = client.get("/api/profiles/99999/social-links", headers=_auth(token))
        assert resp.status_code == 404


# ---- Tests: Update ----


class TestUpdateSocialLink:
    def test_owner_can_update(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="UpdBiz", slug="upd-biz"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _add_social_link(
            client, token, profile_id, "INSTAGRAM", "https://instagram.com/old"
        )
        link_id = create_resp.json()["id"]
        resp = client.put(
            f"/api/social-links/{link_id}",
            json={"url": "https://instagram.com/new"},
            headers=_auth(token),
        )
        assert resp.status_code == 200
        assert resp.json()["url"] == "https://instagram.com/new"

    def test_invalid_url_rejected_on_update(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="UpdBad", slug="upd-bad"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _add_social_link(
            client, token, profile_id, "INSTAGRAM", "https://instagram.com/valid"
        )
        link_id = create_resp.json()["id"]
        resp = client.put(
            f"/api/social-links/{link_id}",
            json={"url": "not-a-url"},
            headers=_auth(token),
        )
        assert resp.status_code == 422

    def test_nonexistent_link_returns_400(self, client, user_one):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = client.put(
            "/api/social-links/99999",
            json={"url": "https://updated.com"},
            headers=_auth(token),
        )
        assert resp.status_code == 400


# ---- Tests: Delete ----


class TestDeleteSocialLink:
    def test_owner_can_delete(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="DelBiz", slug="del-biz"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _add_social_link(
            client, token, profile_id, "INSTAGRAM", "https://instagram.com/del"
        )
        link_id = create_resp.json()["id"]
        resp = client.delete(f"/api/social-links/{link_id}", headers=_auth(token))
        assert resp.status_code == 204

        list_resp = client.get(f"/api/profiles/{profile_id}/social-links", headers=_auth(token))
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 0

    def test_nonexistent_link_returns_404(self, client, user_one):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = client.delete("/api/social-links/99999", headers=_auth(token))
        assert resp.status_code == 404


# ---- Tests: Authorization ----


class TestSocialLinkAuthorization:
    def test_cross_user_cannot_create(self, client, user_one, user_two, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        token2 = _login(client, "user2@example.com", "User2Pass123!")
        profile_resp = _create_profile(
            client, token1, category_id=test_category.id, business_name="User1Biz", slug="user1-biz"
        )
        profile_id = profile_resp.json()["id"]
        resp = _add_social_link(
            client, token2, profile_id, "INSTAGRAM", "https://instagram.com/hack"
        )
        assert resp.status_code == 400
        assert "own profiles" in resp.json()["detail"]

    def test_cross_user_cannot_update(self, client, user_one, user_two, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        token2 = _login(client, "user2@example.com", "User2Pass123!")
        profile_resp = _create_profile(
            client, token1, category_id=test_category.id, business_name="User1B", slug="user1-b"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _add_social_link(
            client, token1, profile_id, "INSTAGRAM", "https://instagram.com/orig"
        )
        link_id = create_resp.json()["id"]
        resp = client.put(
            f"/api/social-links/{link_id}",
            json={"url": "https://hacked.com"},
            headers=_auth(token2),
        )
        assert resp.status_code == 400

    def test_cross_user_cannot_delete(self, client, user_one, user_two, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        token2 = _login(client, "user2@example.com", "User2Pass123!")
        profile_resp = _create_profile(
            client, token1, category_id=test_category.id, business_name="User1C", slug="user1-c"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _add_social_link(
            client, token1, profile_id, "INSTAGRAM", "https://instagram.com/nodelete"
        )
        link_id = create_resp.json()["id"]
        resp = client.delete(f"/api/social-links/{link_id}", headers=_auth(token2))
        assert resp.status_code == 404

    def test_admin_can_update_any_link(self, client, admin_user, user_one, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        admin_token = _login(client, "admin@example.com", "AdminPass123!")
        profile_resp = _create_profile(
            client, token1, category_id=test_category.id, business_name="AdminUpd", slug="admin-upd"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _add_social_link(
            client, token1, profile_id, "INSTAGRAM", "https://instagram.com/orig"
        )
        link_id = create_resp.json()["id"]
        resp = client.put(
            f"/api/social-links/{link_id}",
            json={"url": "https://instagram.com/admin-edited"},
            headers=_auth(admin_token),
        )
        assert resp.status_code == 200
        assert resp.json()["url"] == "https://instagram.com/admin-edited"

    def test_admin_can_delete_any_link(self, client, admin_user, user_one, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        admin_token = _login(client, "admin@example.com", "AdminPass123!")
        profile_resp = _create_profile(
            client, token1, category_id=test_category.id, business_name="AdminDel", slug="admin-del"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _add_social_link(
            client, token1, profile_id, "INSTAGRAM", "https://instagram.com/admin-del"
        )
        link_id = create_resp.json()["id"]
        resp = client.delete(f"/api/social-links/{link_id}", headers=_auth(admin_token))
        assert resp.status_code == 204


# ---- Tests: Platform Validation ----


class TestPlatformValidation:
    def test_valid_platforms_accepted(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="ValidPlat", slug="valid-plat"
        )
        profile_id = profile_resp.json()["id"]
        valid_platforms = ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "YOUTUBE", "X", "WEBSITE"]
        for platform in valid_platforms:
            resp = _add_social_link(
                client, token, profile_id, platform, f"https://{platform.lower()}.com/test"
            )
            assert resp.status_code == 201, f"Platform {platform} should be accepted"

    def test_invalid_platform_returns_422(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="InvPlat", slug="inv-plat"
        )
        profile_id = profile_resp.json()["id"]
        invalid_platforms = ["TIKTOK", "SNAPCHAT", "PINTEREST", "REDDIT", ""]
        for platform in invalid_platforms:
            resp = client.post(
                f"/api/profiles/{profile_id}/social-links",
                json={"platform": platform, "url": "https://test.com"},
                headers=_auth(token),
            )
            assert resp.status_code == 422, f"Platform '{platform}' should be rejected"


# ---- Tests: Response Structure ----


class TestResponseStructure:
    def test_response_has_required_fields(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="RespBiz", slug="resp-biz"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _add_social_link(
            client, token, profile_id, "LINKEDIN", "https://linkedin.com/in/test"
        )
        data = create_resp.json()
        assert "id" in data
        assert "biz_profile_id" in data
        assert "platform" in data
        assert "url" in data
        assert "created_at" in data
        assert "updated_at" in data
        assert data["platform"] == "LINKEDIN"
        assert data["biz_profile_id"] == profile_id

    def test_list_response_structure(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="ListStr", slug="list-str"
        )
        profile_id = profile_resp.json()["id"]
        _add_social_link(client, token, profile_id, "X", "https://x.com/test")
        resp = client.get(f"/api/profiles/{profile_id}/social-links", headers=_auth(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) == 1
        assert resp.json()[0]["platform"] == "X"


# ---- Tests: Cascade Delete ----


class TestCascadeDelete:
    def test_deleting_profile_deletes_social_links(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="CascadeBiz", slug="cascade-biz"
        )
        profile_id = profile_resp.json()["id"]
        _add_social_link(client, token, profile_id, "INSTAGRAM", "https://instagram.com/cascade")
        _add_social_link(client, token, profile_id, "FACEBOOK", "https://facebook.com/cascade")

        del_resp = client.delete(f"/api/profiles/{profile_id}", headers=_auth(token))
        assert del_resp.status_code == 204

        list_resp = client.get(f"/api/profiles/{profile_id}/social-links", headers=_auth(token))
        assert list_resp.status_code == 404


# ---- Tests: Edge Cases ----


class TestEdgeCases:
    def test_same_platform_different_profiles(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        p1 = _create_profile(
            client, token, category_id=test_category.id, business_name="P1", slug="p1"
        )
        p2 = _create_profile(
            client, token, category_id=test_category.id, business_name="P2", slug="p2"
        )
        _add_social_link(
            client, token, p1.json()["id"], "INSTAGRAM", "https://instagram.com/p1"
        )
        resp = _add_social_link(
            client, token, p2.json()["id"], "INSTAGRAM", "https://instagram.com/p2"
        )
        assert resp.status_code == 201

    def test_create_after_delete_allows_recreate(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="ReBiz", slug="re-biz"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _add_social_link(
            client, token, profile_id, "INSTAGRAM", "https://instagram.com/first"
        )
        link_id = create_resp.json()["id"]
        client.delete(f"/api/social-links/{link_id}", headers=_auth(token))

        resp = _add_social_link(
            client, token, profile_id, "INSTAGRAM", "https://instagram.com/second"
        )
        assert resp.status_code == 201

    def test_http_url_accepted(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="HttpBiz", slug="http-biz"
        )
        profile_id = profile_resp.json()["id"]
        resp = _add_social_link(
            client, token, profile_id, "WEBSITE", "http://insecure-site.com"
        )
        assert resp.status_code == 201

    def test_https_url_accepted(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="HttpsBiz", slug="https-biz"
        )
        profile_id = profile_resp.json()["id"]
        resp = _add_social_link(
            client, token, profile_id, "WEBSITE", "https://secure-site.com"
        )
        assert resp.status_code == 201
