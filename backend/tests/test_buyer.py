"""
Comprehensive buyer backend tests.

Tests all buyer endpoints:
  1. Dashboard statistics
  2. Profile
  3. Requirements CRUD
  4. Enquiries
  5. Favorites
  6. Quotations
  7. Messages
  8. Ownership enforcement
  9. Validation
  10. Authorization (seller cannot access buyer endpoints)
"""

import os
import sys
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base
from app.dependencies.database import get_db_session
from app.main import app
from app.models.role import Role, RoleEnum
from app.models.category import Category, Subcategory
from app.models.user import User
from app.models.biz_profile import BizProfile
from app.models.product import Product
from app.models.service import BizService
from app.models.enquiry import Enquiry
from app.models.quotation import Quotation
from app.models.requirement import Requirement
from app.models.message import Message
from app.models.favorite import Favorite
from app.services.password import hash_password

_buyer_counter = 0
_seller_counter = 0


def _buyer_email():
    global _buyer_counter
    _buyer_counter += 1
    return f"buyer{_buyer_counter}@test.com"


def _seller_email():
    global _seller_counter
    _seller_counter += 1
    return f"seller{_seller_counter}@test.com"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ensure_roles(db):
    for name in ["ADMIN", "CUSTOMER", "ENDUSER", "USER"]:
        if not db.query(Role).filter(Role.name == name).first():
            db.add(Role(name=name, description=f"{name} role"))
    db.commit()


def _ensure_category(db, name="Electronics", slug="electronics"):
    cat = db.query(Category).filter(Category.slug == slug).first()
    if not cat:
        cat = Category(name=name, slug=slug, is_active=True)
        db.add(cat)
        db.commit()
        db.refresh(cat)
    return cat


def _ensure_subcategory(db, category_id, name="Phones", slug="phones"):
    sub = db.query(Subcategory).filter(Subcategory.slug == slug).first()
    if not sub:
        sub = Subcategory(category_id=category_id, name=name, slug=slug, is_active=True)
        db.add(sub)
        db.commit()
        db.refresh(sub)
    return sub


_TEST_PASSWORD = "TestPass123!"


def _create_buyer(db, email):
    _ensure_roles(db)
    role = db.query(Role).filter(Role.name == "CUSTOMER").first()
    user = User(
        role_id=role.id,
        full_name=f"Buyer {email.split('@')[0]}",
        email=email,
        password_hash=hash_password(_TEST_PASSWORD),
        is_email_verified=True,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _create_seller(db, email):
    _ensure_roles(db)
    role = db.query(Role).filter(Role.name == "ENDUSER").first()
    user = User(
        role_id=role.id,
        full_name=f"Seller {email.split('@')[0]}",
        email=email,
        password_hash=hash_password(_TEST_PASSWORD),
        is_email_verified=True,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _register_and_login(client, email, role="CUSTOMER", password=_TEST_PASSWORD):
    client.post(
        "/api/auth/register",
        json={
            "full_name": f"User {email.split('@')[0]}",
            "email": email,
            "password": password,
            "role": role,
        },
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    return resp.json()["access_token"]


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def _create_seller_profile(client, token, category_id, **overrides):
    data = {
        "business_name": "Test Business",
        "category_id": category_id,
        "description": "A test business",
        "phone": "+1234567890",
        "email": "biz@test.com",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        **overrides,
    }
    return client.post("/api/seller/profile", json=data, headers=_auth_header(token))


# ===========================================================================
# 1. Dashboard Statistics
# ===========================================================================

class TestBuyerDashboard:
    def test_dashboard_empty(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        resp = client.get("/api/buyer/dashboard", headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["active_requirements"] == 0
        assert data["enquiries_sent"] == 0
        assert data["pending_quotations"] == 0
        assert data["accepted_quotations"] == 0
        assert data["favorite_count"] == 0
        assert data["unread_messages"] == 0

    def test_dashboard_with_data(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        cat = _ensure_category(db, "Food", "food")

        # Create seller profile + product
        seller_email = _seller_email()
        seller = _create_seller(db, seller_email)
        seller_token = _register_and_login(client, seller_email, role="ENDUSER")
        _create_seller_profile(client, seller_token, cat.id)
        profile_resp = client.get("/api/seller/profile", headers=_auth_header(seller_token))
        profile_id = profile_resp.json()["id"]

        product_resp = client.post(
            "/api/seller/products",
            json={"name": "Widget", "category_id": cat.id, "status": "ACTIVE"},
            headers=_auth_header(seller_token),
        )
        product_id = product_resp.json()["id"]

        # Create requirement
        client.post(
            "/api/buyer/requirements",
            json={"title": "Need widgets", "category_id": cat.id},
            headers=_auth_header(token),
        )

        # Create enquiry
        client.post(
            "/api/buyer/enquiries",
            json={"profile_id": profile_id, "product_id": product_id, "message": "Hi"},
            headers=_auth_header(token),
        )

        # Add favorite
        client.post(
            "/api/buyer/favorites",
            json={"target_type": "PRODUCT", "target_id": product_id},
            headers=_auth_header(token),
        )

        # Send message
        client.post(
            "/api/buyer/messages",
            json={"receiver_id": seller.id, "content": "Hello seller"},
            headers=_auth_header(token),
        )

        resp = client.get("/api/buyer/dashboard", headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["active_requirements"] == 1
        assert data["enquiries_sent"] == 1
        assert data["favorite_count"] == 1
        assert data["unread_messages"] == 0  # buyer sent, so seller has unread

    def test_unauthenticated_cannot_access_dashboard(self, client):
        resp = client.get("/api/buyer/dashboard")
        assert resp.status_code in (401, 403)

    def test_seller_cannot_access_buyer_dashboard(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email, role="ENDUSER")

        resp = client.get("/api/buyer/dashboard", headers=_auth_header(token))
        assert resp.status_code == 403


# ===========================================================================
# 2. Profile
# ===========================================================================

class TestBuyerProfile:
    def test_get_profile(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        resp = client.get("/api/buyer/profile", headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == email
        assert data["is_active"] is True

    def test_update_profile(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        resp = client.put(
            "/api/buyer/profile",
            json={"full_name": "Updated Name", "city": "Delhi"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["full_name"] == "Updated Name"
        assert data["city"] == "Delhi"

    def test_update_profile_validation(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        resp = client.put(
            "/api/buyer/profile",
            json={"full_name": ""},  # invalid: too short
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_seller_cannot_access_buyer_profile(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email, role="ENDUSER")

        resp = client.get("/api/buyer/profile", headers=_auth_header(token))
        assert resp.status_code == 403


# ===========================================================================
# 3. Requirements
# ===========================================================================

class TestBuyerRequirements:
    def test_create_requirement(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Services", "services")

        resp = client.post(
            "/api/buyer/requirements",
            json={"title": "Need web development", "category_id": cat.id, "budget": 5000},
            headers=_auth_header(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Need web development"
        assert data["status"] == "OPEN"
        assert data["budget"] == 5000

    def test_list_requirements(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        # Create 3 requirements
        for i in range(3):
            client.post(
                "/api/buyer/requirements",
                json={"title": f"Requirement {i}"},
                headers=_auth_header(token),
            )

        resp = client.get("/api/buyer/requirements", headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 3
        assert len(data["items"]) == 3

    def test_get_requirement(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        create_resp = client.post(
            "/api/buyer/requirements",
            json={"title": "Test req"},
            headers=_auth_header(token),
        )
        req_id = create_resp.json()["id"]

        resp = client.get(f"/api/buyer/requirements/{req_id}", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["title"] == "Test req"

    def test_update_requirement(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        create_resp = client.post(
            "/api/buyer/requirements",
            json={"title": "Old title"},
            headers=_auth_header(token),
        )
        req_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/buyer/requirements/{req_id}",
            json={"title": "New title", "status": "IN_PROGRESS"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "New title"
        assert resp.json()["status"] == "IN_PROGRESS"

    def test_delete_requirement(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        create_resp = client.post(
            "/api/buyer/requirements",
            json={"title": "To delete"},
            headers=_auth_header(token),
        )
        req_id = create_resp.json()["id"]

        resp = client.delete(f"/api/buyer/requirements/{req_id}", headers=_auth_header(token))
        assert resp.status_code == 204

        # Verify it's gone
        resp = client.get(f"/api/buyer/requirements/{req_id}", headers=_auth_header(token))
        assert resp.status_code == 404

    def test_cannot_access_other_buyer_requirement(self, client, db):
        email1 = _buyer_email()
        _create_buyer(db, email1)
        token1 = _register_and_login(client, email1)

        email2 = _buyer_email()
        _create_buyer(db, email2)
        token2 = _register_and_login(client, email2)

        # Buyer1 creates requirement
        create_resp = client.post(
            "/api/buyer/requirements",
            json={"title": "Buyer1 requirement"},
            headers=_auth_header(token1),
        )
        req_id = create_resp.json()["id"]

        # Buyer2 cannot access it
        resp = client.get(f"/api/buyer/requirements/{req_id}", headers=_auth_header(token2))
        assert resp.status_code == 403

    def test_requirement_validation(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        resp = client.post(
            "/api/buyer/requirements",
            json={"title": ""},  # invalid
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_requirement_invalid_category(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        resp = client.post(
            "/api/buyer/requirements",
            json={"title": "Test", "category_id": 99999},
            headers=_auth_header(token),
        )
        assert resp.status_code == 404
        assert "Category not found" in resp.json()["detail"]

    def test_requirement_pagination(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        for i in range(5):
            client.post(
                "/api/buyer/requirements",
                json={"title": f"Req {i}"},
                headers=_auth_header(token),
            )

        resp = client.get("/api/buyer/requirements?page=1&page_size=2", headers=_auth_header(token))
        data = resp.json()
        assert data["total"] == 5
        assert len(data["items"]) == 2
        assert data["total_pages"] == 3


# ===========================================================================
# 4. Enquiries
# ===========================================================================

class TestBuyerEnquiries:
    def _setup_seller_with_product(self, client, db):
        """Helper to create a seller with a profile and active product."""
        cat = _ensure_category(db, "Electronics", "electronics2")
        seller_email = _seller_email()
        seller = _create_seller(db, seller_email)
        seller_token = _register_and_login(client, seller_email, role="ENDUSER")
        _create_seller_profile(client, seller_token, cat.id)
        profile_resp = client.get("/api/seller/profile", headers=_auth_header(seller_token))
        profile_id = profile_resp.json()["id"]

        product_resp = client.post(
            "/api/seller/products",
            json={"name": "Laptop", "category_id": cat.id, "status": "ACTIVE"},
            headers=_auth_header(seller_token),
        )
        product_id = product_resp.json()["id"]
        return seller, profile_id, product_id

    def test_create_enquiry_for_product(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        seller, profile_id, product_id = self._setup_seller_with_product(client, db)

        resp = client.post(
            "/api/buyer/enquiries",
            json={"profile_id": profile_id, "product_id": product_id, "message": "Is this available?"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["message"] == "Is this available?"
        assert data["status"] == "NEW"

    def test_create_enquiry_for_service(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        cat = _ensure_category(db, "Consulting", "consulting")
        seller_email = _seller_email()
        seller = _create_seller(db, seller_email)
        seller_token = _register_and_login(client, seller_email, role="ENDUSER")
        _create_seller_profile(client, seller_token, cat.id)
        profile_resp = client.get("/api/seller/profile", headers=_auth_header(seller_token))
        profile_id = profile_resp.json()["id"]

        service_resp = client.post(
            "/api/seller/services",
            json={"name": "Consulting", "category_id": cat.id, "status": "ACTIVE"},
            headers=_auth_header(seller_token),
        )
        service_id = service_resp.json()["id"]

        resp = client.post(
            "/api/buyer/enquiries",
            json={"profile_id": profile_id, "service_id": service_id, "message": "Need consulting"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 201
        assert resp.json()["service_id"] == service_id

    def test_create_enquiry_invalid_profile(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        resp = client.post(
            "/api/buyer/enquiries",
            json={"profile_id": 99999, "message": "Hi"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    def test_create_enquiry_inactive_product(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        cat = _ensure_category(db, "Gadgets", "gadgets")
        seller_email = _seller_email()
        seller = _create_seller(db, seller_email)
        seller_token = _register_and_login(client, seller_email, role="ENDUSER")
        _create_seller_profile(client, seller_token, cat.id)
        profile_resp = client.get("/api/seller/profile", headers=_auth_header(seller_token))
        profile_id = profile_resp.json()["id"]

        product_resp = client.post(
            "/api/seller/products",
            json={"name": "Inactive item", "category_id": cat.id, "status": "INACTIVE"},
            headers=_auth_header(seller_token),
        )
        product_id = product_resp.json()["id"]

        resp = client.post(
            "/api/buyer/enquiries",
            json={"profile_id": profile_id, "product_id": product_id, "message": "Hi"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 400
        assert "not available" in resp.json()["detail"].lower()

    def test_list_enquiries(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        seller, profile_id, product_id = self._setup_seller_with_product(client, db)

        for i in range(3):
            client.post(
                "/api/buyer/enquiries",
                json={"profile_id": profile_id, "product_id": product_id, "message": f"Enquiry {i}"},
                headers=_auth_header(token),
            )

        resp = client.get("/api/buyer/enquiries", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["total"] == 3

    def test_get_enquiry(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        seller, profile_id, product_id = self._setup_seller_with_product(client, db)
        create_resp = client.post(
            "/api/buyer/enquiries",
            json={"profile_id": profile_id, "product_id": product_id, "message": "Test"},
            headers=_auth_header(token),
        )
        enquiry_id = create_resp.json()["id"]

        resp = client.get(f"/api/buyer/enquiries/{enquiry_id}", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["message"] == "Test"

    def test_cannot_access_other_buyer_enquiry(self, client, db):
        email1 = _buyer_email()
        _create_buyer(db, email1)
        token1 = _register_and_login(client, email1)

        email2 = _buyer_email()
        _create_buyer(db, email2)
        token2 = _register_and_login(client, email2)

        seller, profile_id, product_id = TestBuyerEnquiries._setup_seller_with_product(self, client, db)
        create_resp = client.post(
            "/api/buyer/enquiries",
            json={"profile_id": profile_id, "product_id": product_id, "message": "Buyer1 enquiry"},
            headers=_auth_header(token1),
        )
        enquiry_id = create_resp.json()["id"]

        resp = client.get(f"/api/buyer/enquiries/{enquiry_id}", headers=_auth_header(token2))
        assert resp.status_code == 403


# ===========================================================================
# 5. Favorites
# ===========================================================================

class TestBuyerFavorites:
    def _setup_seller_with_product(self, client, db):
        cat = _ensure_category(db, "Toys", "toys")
        seller_email = _seller_email()
        seller = _create_seller(db, seller_email)
        seller_token = _register_and_login(client, seller_email, role="ENDUSER")
        _create_seller_profile(client, seller_token, cat.id)
        profile_resp = client.get("/api/seller/profile", headers=_auth_header(seller_token))
        profile_id = profile_resp.json()["id"]

        product_resp = client.post(
            "/api/seller/products",
            json={"name": "Toy", "category_id": cat.id, "status": "ACTIVE"},
            headers=_auth_header(seller_token),
        )
        product_id = product_resp.json()["id"]
        return profile_id, product_id

    def test_add_favorite_product(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        profile_id, product_id = self._setup_seller_with_product(client, db)

        resp = client.post(
            "/api/buyer/favorites",
            json={"target_type": "PRODUCT", "target_id": product_id},
            headers=_auth_header(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["target_type"] == "PRODUCT"
        assert data["target_id"] == product_id

    def test_add_favorite_profile(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        profile_id, product_id = self._setup_seller_with_product(client, db)

        resp = client.post(
            "/api/buyer/favorites",
            json={"target_type": "BIZ_PROFILE", "target_id": profile_id},
            headers=_auth_header(token),
        )
        assert resp.status_code == 201

    def test_duplicate_favorite_rejected(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        _, product_id = self._setup_seller_with_product(client, db)

        client.post(
            "/api/buyer/favorites",
            json={"target_type": "PRODUCT", "target_id": product_id},
            headers=_auth_header(token),
        )

        resp = client.post(
            "/api/buyer/favorites",
            json={"target_type": "PRODUCT", "target_id": product_id},
            headers=_auth_header(token),
        )
        assert resp.status_code == 400
        assert "already" in resp.json()["detail"].lower()

    def test_list_favorites(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        _, product_id = self._setup_seller_with_product(client, db)
        client.post(
            "/api/buyer/favorites",
            json={"target_type": "PRODUCT", "target_id": product_id},
            headers=_auth_header(token),
        )

        resp = client.get("/api/buyer/favorites", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["total"] == 1

    def test_remove_favorite(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        _, product_id = self._setup_seller_with_product(client, db)
        create_resp = client.post(
            "/api/buyer/favorites",
            json={"target_type": "PRODUCT", "target_id": product_id},
            headers=_auth_header(token),
        )
        fav_id = create_resp.json()["id"]

        resp = client.delete(f"/api/buyer/favorites/{fav_id}", headers=_auth_header(token))
        assert resp.status_code == 204

        # Verify removed
        resp = client.get("/api/buyer/favorites", headers=_auth_header(token))
        assert resp.json()["total"] == 0

    def test_cannot_remove_others_favorite(self, client, db):
        email1 = _buyer_email()
        _create_buyer(db, email1)
        token1 = _register_and_login(client, email1)

        email2 = _buyer_email()
        _create_buyer(db, email2)
        token2 = _register_and_login(client, email2)

        _, product_id = self._setup_seller_with_product(client, db)
        create_resp = client.post(
            "/api/buyer/favorites",
            json={"target_type": "PRODUCT", "target_id": product_id},
            headers=_auth_header(token1),
        )
        fav_id = create_resp.json()["id"]

        resp = client.delete(f"/api/buyer/favorites/{fav_id}", headers=_auth_header(token2))
        assert resp.status_code == 403

    def test_invalid_target_type(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        resp = client.post(
            "/api/buyer/favorites",
            json={"target_type": "INVALID", "target_id": 1},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422


# ===========================================================================
# 6. Quotations
# ===========================================================================

class TestBuyerQuotations:
    def _setup_enquiry_with_quotation(self, client, db, buyer_token, buyer_id):
        """Create a seller, product, buyer enquiry, and seller quotation."""
        cat = _ensure_category(db, "Home", "home")
        seller_email = _seller_email()
        seller = _create_seller(db, seller_email)
        seller_token = _register_and_login(client, seller_email, role="ENDUSER")
        _create_seller_profile(client, seller_token, cat.id)
        profile_resp = client.get("/api/seller/profile", headers=_auth_header(seller_token))
        profile_id = profile_resp.json()["id"]

        product_resp = client.post(
            "/api/seller/products",
            json={"name": "Furniture", "category_id": cat.id, "status": "ACTIVE"},
            headers=_auth_header(seller_token),
        )
        product_id = product_resp.json()["id"]

        # Buyer creates enquiry
        enquiry_resp = client.post(
            "/api/buyer/enquiries",
            json={"profile_id": profile_id, "product_id": product_id, "message": "Want this"},
            headers=_auth_header(buyer_token),
        )
        enquiry_id = enquiry_resp.json()["id"]

        # Seller creates quotation
        quote_resp = client.post(
            "/api/seller/quotations",
            json={"enquiry_id": enquiry_id, "amount": 100.0, "description": "Best price"},
            headers=_auth_header(seller_token),
        )
        quotation_id = quote_resp.json()["id"]
        return quotation_id, seller, seller_token

    def test_list_quotations(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        self._setup_enquiry_with_quotation(client, db, token, buyer.id)

        resp = client.get("/api/buyer/quotations", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["total"] == 1

    def test_get_quotation(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        quotation_id, _, _ = self._setup_enquiry_with_quotation(client, db, token, buyer.id)

        resp = client.get(f"/api/buyer/quotations/{quotation_id}", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["amount"] == 100.0

    def test_accept_quotation(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        quotation_id, _, _ = self._setup_enquiry_with_quotation(client, db, token, buyer.id)

        resp = client.patch(f"/api/buyer/quotations/{quotation_id}/accept", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["status"] == "ACCEPTED"

    def test_reject_quotation(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        quotation_id, _, _ = self._setup_enquiry_with_quotation(client, db, token, buyer.id)

        resp = client.patch(f"/api/buyer/quotations/{quotation_id}/reject", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["status"] == "REJECTED"

    def test_accept_already_accepted_quotation(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        quotation_id, _, _ = self._setup_enquiry_with_quotation(client, db, token, buyer.id)

        # Accept first
        client.patch(f"/api/buyer/quotations/{quotation_id}/accept", headers=_auth_header(token))

        # Try to accept again
        resp = client.patch(f"/api/buyer/quotations/{quotation_id}/accept", headers=_auth_header(token))
        assert resp.status_code == 400
        assert "ACCEPTED" in resp.json()["detail"]

    def test_reject_already_rejected_quotation(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        quotation_id, _, _ = self._setup_enquiry_with_quotation(client, db, token, buyer.id)

        # Reject first
        client.patch(f"/api/buyer/quotations/{quotation_id}/reject", headers=_auth_header(token))

        # Try to reject again
        resp = client.patch(f"/api/buyer/quotations/{quotation_id}/reject", headers=_auth_header(token))
        assert resp.status_code == 400
        assert "REJECTED" in resp.json()["detail"]

    def test_cannot_access_other_buyer_quotation(self, client, db):
        email1 = _buyer_email()
        buyer1 = _create_buyer(db, email1)
        token1 = _register_and_login(client, email1)

        email2 = _buyer_email()
        _create_buyer(db, email2)
        token2 = _register_and_login(client, email2)

        quotation_id, _, _ = self._setup_enquiry_with_quotation(client, db, token1, buyer1.id)

        resp = client.get(f"/api/buyer/quotations/{quotation_id}", headers=_auth_header(token2))
        assert resp.status_code == 403

    def test_dashboard_pending_quotation_count(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        self._setup_enquiry_with_quotation(client, db, token, buyer.id)

        resp = client.get("/api/buyer/dashboard", headers=_auth_header(token))
        assert resp.json()["pending_quotations"] == 1

        # Accept it
        # Need to get the quotation ID first
        quotes = client.get("/api/buyer/quotations", headers=_auth_header(token))
        qid = quotes.json()["items"][0]["id"]
        client.patch(f"/api/buyer/quotations/{qid}/accept", headers=_auth_header(token))

        resp = client.get("/api/buyer/dashboard", headers=_auth_header(token))
        assert resp.json()["pending_quotations"] == 0
        assert resp.json()["accepted_quotations"] == 1


# ===========================================================================
# 7. Messages
# ===========================================================================

class TestBuyerMessages:
    def test_send_message(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        seller_email = _seller_email()
        seller = _create_seller(db, seller_email)
        _register_and_login(client, seller_email, role="ENDUSER")

        resp = client.post(
            "/api/buyer/messages",
            json={"receiver_id": seller.id, "content": "Hello seller"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["content"] == "Hello seller"
        assert data["sender_id"] == buyer.id

    def test_send_message_to_self_rejected(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        resp = client.post(
            "/api/buyer/messages",
            json={"receiver_id": buyer.id, "content": "Self message"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 400
        assert "yourself" in resp.json()["detail"].lower()

    def test_send_message_to_nonexistent_user(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        resp = client.post(
            "/api/buyer/messages",
            json={"receiver_id": 99999, "content": "Hello"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 400
        assert "not exist" in resp.json()["detail"].lower()

    def test_list_conversations(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        seller_email = _seller_email()
        seller = _create_seller(db, seller_email)
        _register_and_login(client, seller_email, role="ENDUSER")

        # Send a message
        client.post(
            "/api/buyer/messages",
            json={"receiver_id": seller.id, "content": "Hi"},
            headers=_auth_header(token),
        )

        resp = client.get("/api/buyer/messages/conversations", headers=_auth_header(token))
        assert resp.status_code == 200
        conversations = resp.json()
        assert len(conversations) == 1
        assert conversations[0]["partner_id"] == seller.id

    def test_get_messages(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        seller_email = _seller_email()
        seller = _create_seller(db, seller_email)
        _register_and_login(client, seller_email, role="ENDUSER")

        client.post(
            "/api/buyer/messages",
            json={"receiver_id": seller.id, "content": "Hello"},
            headers=_auth_header(token),
        )

        resp = client.get(f"/api/buyer/messages/{seller.id}", headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["content"] == "Hello"

    def test_mark_messages_read(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        seller_email = _seller_email()
        seller = _create_seller(db, seller_email)
        seller_token = _register_and_login(client, seller_email, role="ENDUSER")

        # Seller sends to buyer
        client.post(
            "/api/seller/messages",
            json={"receiver_id": buyer.id, "content": "From seller"},
            headers=_auth_header(seller_token),
        )

        # Check unread count
        resp = client.get("/api/buyer/dashboard", headers=_auth_header(token))
        assert resp.json()["unread_messages"] == 1

        # Mark as read
        resp = client.put(f"/api/buyer/messages/{seller.id}/read", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["marked_read"] == 1

        # Check unread count is now 0
        resp = client.get("/api/buyer/dashboard", headers=_auth_header(token))
        assert resp.json()["unread_messages"] == 0

    def test_message_pagination(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        seller_email = _seller_email()
        seller = _create_seller(db, seller_email)
        _register_and_login(client, seller_email, role="ENDUSER")

        for i in range(5):
            client.post(
                "/api/buyer/messages",
                json={"receiver_id": seller.id, "content": f"Message {i}"},
                headers=_auth_header(token),
            )

        resp = client.get(f"/api/buyer/messages/{seller.id}?page=1&page_size=2", headers=_auth_header(token))
        data = resp.json()
        assert data["total"] == 5
        assert len(data["items"]) == 2

    def test_buyer_cannot_access_seller_messages(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email)

        seller_email = _seller_email()
        _create_seller(db, seller_email)
        seller_token = _register_and_login(client, seller_email, role="ENDUSER")

        # Seller sends to another seller
        seller2_email = _seller_email()
        seller2 = _create_seller(db, seller2_email)
        seller2_token = _register_and_login(client, seller2_email, role="ENDUSER")

        client.post(
            "/api/seller/messages",
            json={"receiver_id": seller2.id, "content": "Private"},
            headers=_auth_header(seller_token),
        )

        # Buyer cannot see this conversation
        resp = client.get(f"/api/buyer/messages/{seller2.id}", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["total"] == 0


# ===========================================================================
# 8. Cross-role Authorization
# ===========================================================================

class TestBuyerAuthorization:
    def test_seller_cannot_access_buyer_endpoints(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email, role="ENDUSER")

        endpoints = [
            ("GET", "/api/buyer/dashboard"),
            ("GET", "/api/buyer/profile"),
            ("GET", "/api/buyer/requirements"),
            ("GET", "/api/buyer/enquiries"),
            ("GET", "/api/buyer/favorites"),
            ("GET", "/api/buyer/quotations"),
            ("GET", "/api/buyer/messages/conversations"),
        ]
        for method, path in endpoints:
            resp = client.get(path, headers=_auth_header(token))
            assert resp.status_code == 403, f"Expected 403 for {method} {path}"

    def test_unauthenticated_cannot_access_buyer_endpoints(self, client):
        endpoints = [
            "/api/buyer/dashboard",
            "/api/buyer/profile",
            "/api/buyer/requirements",
            "/api/buyer/enquiries",
            "/api/buyer/favorites",
            "/api/buyer/quotations",
            "/api/buyer/messages/conversations",
        ]
        for path in endpoints:
            resp = client.get(path)
            assert resp.status_code in (401, 403), f"Expected 401/403 for {path}"


# ===========================================================================
# 9. Favorites in Dashboard
# ===========================================================================

class TestBuyerFavoritesDashboard:
    def test_favorite_count_in_dashboard(self, client, db):
        email = _buyer_email()
        buyer = _create_buyer(db, email)
        token = _register_and_login(client, email)

        cat = _ensure_category(db, "Books", "books")
        seller_email = _seller_email()
        _create_seller(db, seller_email)
        seller_token = _register_and_login(client, seller_email, role="ENDUSER")
        _create_seller_profile(client, seller_token, cat.id)
        profile_resp = client.get("/api/seller/profile", headers=_auth_header(seller_token))
        profile_id = profile_resp.json()["id"]

        product_resp = client.post(
            "/api/seller/products",
            json={"name": "Book", "category_id": cat.id, "status": "ACTIVE"},
            headers=_auth_header(seller_token),
        )
        product_id = product_resp.json()["id"]

        # Add 2 favorites
        client.post(
            "/api/buyer/favorites",
            json={"target_type": "PRODUCT", "target_id": product_id},
            headers=_auth_header(token),
        )
        client.post(
            "/api/buyer/favorites",
            json={"target_type": "BIZ_PROFILE", "target_id": profile_id},
            headers=_auth_header(token),
        )

        resp = client.get("/api/buyer/dashboard", headers=_auth_header(token))
        assert resp.json()["favorite_count"] == 2

        # Remove one
        favs = client.get("/api/buyer/favorites", headers=_auth_header(token))
        fav_id = favs.json()["items"][0]["id"]
        client.delete(f"/api/buyer/favorites/{fav_id}", headers=_auth_header(token))

        resp = client.get("/api/buyer/dashboard", headers=_auth_header(token))
        assert resp.json()["favorite_count"] == 1
