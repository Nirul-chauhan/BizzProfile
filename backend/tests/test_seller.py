"""
Comprehensive seller backend tests.

Tests all seller endpoints:
  1. Dashboard statistics
  2. Business profile CRUD
  3. Business location
  4. Social links
  5. Documents/verification
  6. Products CRUD
  7. Product images
  8. Services CRUD
  9. Business hours
  10. Enquiries
  11. Quotations
  12. Requirements
  13. Messages
  14. Profile settings
  15. Ownership enforcement
  16. Validation
  17. Authorization (buyer cannot access seller endpoints)
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
from app.services.password import hash_password

_seller_counter = 0
_buyer_counter = 0
_product_counter = 0


def _seller_email():
    global _seller_counter
    _seller_counter += 1
    return f"seller{_seller_counter}@test.com"


def _buyer_email():
    global _buyer_counter
    _buyer_counter += 1
    return f"buyer{_buyer_counter}@test.com"


def _product_slug():
    global _product_counter
    _product_counter += 1
    return f"product-{_product_counter}"


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


def _register_and_login(client, email, role="ENDUSER", password=_TEST_PASSWORD):
    # Register (ignore result — user may already exist from _create_seller/_create_buyer)
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


def _create_profile(client, token, category_id, **overrides):
    data = {
        "business_name": "Test Business",
        "category_id": category_id,
        "description": "A test business",
        "phone": "+1234567890",
        "email": "biz@test.com",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "latitude": 19.0760,
        "longitude": 72.8777,
        **overrides,
    }
    resp = client.post(
        "/api/seller/profile",
        json=data,
        headers=_auth_header(token),
    )
    return resp


# ===========================================================================
# 1. Dashboard Statistics
# ===========================================================================

class TestSellerDashboard:
    def test_dashboard_empty(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)

        resp = client.get("/api/seller/dashboard", headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_products"] == 0
        assert data["active_products"] == 0
        assert data["total_services"] == 0
        assert data["active_services"] == 0
        assert data["new_enquiries"] == 0
        assert data["pending_quotations"] == 0
        assert data["accepted_quotations"] == 0
        assert data["profile_completion"] == 0
        assert data["verification_status"] == "PENDING"

    def test_dashboard_with_data(self, client, db):
        email = _seller_email()
        user = _create_seller(db, email)
        token = _register_and_login(client, email)

        cat = _ensure_category(db, "Food", "food")

        # Create profile
        _create_profile(client, token, cat.id)

        # Get profile ID
        profile_resp = client.get("/api/seller/profile", headers=_auth_header(token))
        profile_id = profile_resp.json()["id"]

        # Create products
        for i in range(3):
            client.post(
                "/api/seller/products",
                json={"name": f"Product {i}", "category_id": cat.id, "status": "ACTIVE"},
                headers=_auth_header(token),
            )

        # Create services
        client.post(
            "/api/seller/services",
            json={"name": "Service 1", "category_id": cat.id, "status": "ACTIVE"},
            headers=_auth_header(token),
        )

        resp = client.get("/api/seller/dashboard", headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_products"] == 3
        assert data["active_products"] == 3
        assert data["total_services"] == 1
        assert data["active_services"] == 1
        assert data["profile_completion"] > 0

    def test_buyer_cannot_access_seller_dashboard(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email, role="CUSTOMER")

        resp = client.get("/api/seller/dashboard", headers=_auth_header(token))
        assert resp.status_code == 403

    def test_unauthenticated_cannot_access_dashboard(self, client):
        resp = client.get("/api/seller/dashboard")
        assert resp.status_code in (401, 403)


# ===========================================================================
# 2-3. Business Profile
# ===========================================================================

class TestSellerProfile:
    def test_create_profile(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Fashion", "fashion")

        resp = _create_profile(client, token, cat.id)
        assert resp.status_code == 201
        data = resp.json()
        assert data["business_name"] == "Test Business"
        assert data["category_id"] == cat.id
        assert data["is_public"] is True
        assert data["is_active"] is True
        assert data["latitude"] == pytest.approx(19.0760)
        assert data["longitude"] == pytest.approx(72.8777)

    def test_get_profile(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Books", "books")

        _create_profile(client, token, cat.id)

        resp = client.get("/api/seller/profile", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["business_name"] == "Test Business"

    def test_update_profile(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Toys", "toys")

        _create_profile(client, token, cat.id)

        resp = client.put(
            "/api/seller/profile",
            json={"business_name": "Updated Business", "description": "Updated desc"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 200
        assert resp.json()["business_name"] == "Updated Business"
        assert resp.json()["description"] == "Updated desc"

    def test_cannot_create_duplicate_profile(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Games", "games")

        _create_profile(client, token, cat.id)
        resp = _create_profile(client, token, cat.id)
        assert resp.status_code == 400

    def test_profile_validation_invalid_latitude(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Health", "health")

        resp = client.post(
            "/api/seller/profile",
            json={"business_name": "Bad Lat", "category_id": cat.id, "latitude": 999},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_profile_validation_invalid_longitude(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Music", "music")

        resp = client.post(
            "/api/seller/profile",
            json={"business_name": "Bad Lng", "category_id": cat.id, "longitude": -999},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_profile_validation_invalid_email(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Auto", "auto")

        resp = client.post(
            "/api/seller/profile",
            json={"business_name": "Bad Email", "category_id": cat.id, "email": "not-email"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_profile_validation_invalid_website(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Pets", "pets")

        resp = client.post(
            "/api/seller/profile",
            json={"business_name": "Bad Web", "category_id": cat.id, "website": "ftp://bad.com"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_profile_without_category(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)

        resp = client.post(
            "/api/seller/profile",
            json={"business_name": "No Category"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_get_profile_before_create(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)

        resp = client.get("/api/seller/profile", headers=_auth_header(token))
        assert resp.status_code in (400, 404)
        assert "profile" in resp.json()["detail"].lower()

    def test_update_location(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Travel", "travel")

        _create_profile(client, token, cat.id)

        resp = client.put(
            "/api/seller/profile/location",
            params={"latitude": 28.6139, "longitude": 77.2090},
            headers=_auth_header(token),
        )
        assert resp.status_code == 200
        assert resp.json()["latitude"] == pytest.approx(28.6139)
        assert resp.json()["longitude"] == pytest.approx(77.2090)


# ===========================================================================
# 4. Social Links
# ===========================================================================

class TestSellerSocialLinks:
    def test_list_social_links_empty(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Social", "social")

        _create_profile(client, token, cat.id)

        resp = client.get("/api/seller/social-links", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_create_social_link(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Social2", "social2")

        _create_profile(client, token, cat.id)

        resp = client.post(
            "/api/seller/social-links",
            params={"platform": "INSTAGRAM", "url": "https://instagram.com/test"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 201
        assert resp.json()["platform"] == "INSTAGRAM"

    def test_delete_social_link(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Social3", "social3")

        _create_profile(client, token, cat.id)

        create_resp = client.post(
            "/api/seller/social-links",
            params={"platform": "FACEBOOK", "url": "https://facebook.com/test"},
            headers=_auth_header(token),
        )
        link_id = create_resp.json()["id"]

        resp = client.delete(
            f"/api/seller/social-links/{link_id}",
            headers=_auth_header(token),
        )
        assert resp.status_code == 204


# ===========================================================================
# 5. Documents
# ===========================================================================

class TestSellerDocuments:
    def test_list_documents_empty(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Docs", "docs")

        _create_profile(client, token, cat.id)

        resp = client.get("/api/seller/documents", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json() == []


# ===========================================================================
# 6. Products
# ===========================================================================

class TestSellerProducts:
    def test_create_product(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Laptops", "laptops")

        _create_profile(client, token, cat.id)

        resp = client.post(
            "/api/seller/products",
            json={
                "name": "Gaming Laptop",
                "category_id": cat.id,
                "description": "High performance",
                "price": 99999.99,
                "price_unit": "INR",
                "is_available": True,
                "status": "ACTIVE",
            },
            headers=_auth_header(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Gaming Laptop"
        assert data["price"] == 99999.99
        assert data["status"] == "ACTIVE"
        assert data["is_available"] is True

    def test_list_products(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Shirts", "shirts")

        _create_profile(client, token, cat.id)

        # Create 3 products
        for i in range(3):
            client.post(
                "/api/seller/products",
                json={"name": f"Shirt {i}", "category_id": cat.id},
                headers=_auth_header(token),
            )

        resp = client.get("/api/seller/products", headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 3
        assert len(data["items"]) == 3

    def test_get_product(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Pants", "pants")

        _create_profile(client, token, cat.id)

        create_resp = client.post(
            "/api/seller/products",
            json={"name": "Jeans", "category_id": cat.id, "price": 1500},
            headers=_auth_header(token),
        )
        product_id = create_resp.json()["id"]

        resp = client.get(f"/api/seller/products/{product_id}", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Jeans"
        assert resp.json()["price"] == 1500

    def test_update_product(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Caps", "caps")

        _create_profile(client, token, cat.id)

        create_resp = client.post(
            "/api/seller/products",
            json={"name": "Baseball Cap", "category_id": cat.id},
            headers=_auth_header(token),
        )
        product_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/seller/products/{product_id}",
            json={"name": "Running Cap", "price": 500},
            headers=_auth_header(token),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Running Cap"
        assert resp.json()["price"] == 500

    def test_delete_product(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Socks", "socks")

        _create_profile(client, token, cat.id)

        create_resp = client.post(
            "/api/seller/products",
            json={"name": "Ankle Socks", "category_id": cat.id},
            headers=_auth_header(token),
        )
        product_id = create_resp.json()["id"]

        resp = client.delete(f"/api/seller/products/{product_id}", headers=_auth_header(token))
        assert resp.status_code == 204

        # Verify deleted
        resp = client.get(f"/api/seller/products/{product_id}", headers=_auth_header(token))
        assert resp.status_code == 404

    def test_cannot_access_other_sellers_product(self, client, db):
        email1 = _seller_email()
        email2 = _seller_email()
        user1 = _create_seller(db, email1)
        user2 = _create_seller(db, email2)
        token1 = _register_and_login(client, email1)
        token2 = _register_and_login(client, email2)
        cat = _ensure_category(db, "Exclusive", "exclusive")

        _create_profile(client, token1, cat.id)
        _create_profile(client, token2, cat.id)

        create_resp = client.post(
            "/api/seller/products",
            json={"name": "Secret Product", "category_id": cat.id},
            headers=_auth_header(token1),
        )
        product_id = create_resp.json()["id"]

        # Seller 2 cannot access Seller 1's product
        resp = client.get(f"/api/seller/products/{product_id}", headers=_auth_header(token2))
        assert resp.status_code == 403

    def test_product_pagination(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Paginated", "paginated")

        _create_profile(client, token, cat.id)

        for i in range(5):
            client.post(
                "/api/seller/products",
                json={"name": f"Item {i}", "category_id": cat.id},
                headers=_auth_header(token),
            )

        resp = client.get("/api/seller/products?page=1&page_size=2", headers=_auth_header(token))
        data = resp.json()
        assert len(data["items"]) == 2
        assert data["total"] == 5
        assert data["total_pages"] == 3

    def test_product_validation_negative_price(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Neg", "neg")

        _create_profile(client, token, cat.id)

        resp = client.post(
            "/api/seller/products",
            json={"name": "Bad Price", "category_id": cat.id, "price": -100},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_product_validation_invalid_status(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "BadStatus", "badstatus")

        _create_profile(client, token, cat.id)

        resp = client.post(
            "/api/seller/products",
            json={"name": "Bad Status", "category_id": cat.id, "status": "INVALID"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_product_without_profile(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "NoProfile", "noprofile")

        resp = client.post(
            "/api/seller/products",
            json={"name": "No Profile", "category_id": cat.id},
            headers=_auth_header(token),
        )
        assert resp.status_code == 400


# ===========================================================================
# 7. Product Images
# ===========================================================================

class TestSellerProductImages:
    def test_list_product_images(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Cameras", "cameras")

        _create_profile(client, token, cat.id)

        create_resp = client.post(
            "/api/seller/products",
            json={"name": "Camera", "category_id": cat.id},
            headers=_auth_header(token),
        )
        product_id = create_resp.json()["id"]

        resp = client.get(f"/api/seller/products/{product_id}/images", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_add_product_image(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Watches", "watches")

        _create_profile(client, token, cat.id)

        create_resp = client.post(
            "/api/seller/products",
            json={"name": "Watch", "category_id": cat.id},
            headers=_auth_header(token),
        )
        product_id = create_resp.json()["id"]

        resp = client.post(
            f"/api/seller/products/{product_id}/images",
            params={"image_url": "/uploads/watch.jpg", "sort_order": 0, "is_primary": True},
            headers=_auth_header(token),
        )
        assert resp.status_code == 201
        assert resp.json()["image_url"] == "/uploads/watch.jpg"
        assert resp.json()["is_primary"] is True

    def test_delete_product_image(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Rings", "rings")

        _create_profile(client, token, cat.id)

        create_resp = client.post(
            "/api/seller/products",
            json={"name": "Ring", "category_id": cat.id},
            headers=_auth_header(token),
        )
        product_id = create_resp.json()["id"]

        img_resp = client.post(
            f"/api/seller/products/{product_id}/images",
            params={"image_url": "/uploads/ring.jpg"},
            headers=_auth_header(token),
        )
        image_id = img_resp.json()["id"]

        resp = client.delete(f"/api/seller/product-images/{image_id}", headers=_auth_header(token))
        assert resp.status_code == 204


# ===========================================================================
# 8. Services
# ===========================================================================

class TestSellerServices:
    def test_create_service(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Repair", "repair")

        _create_profile(client, token, cat.id)

        resp = client.post(
            "/api/seller/services",
            json={
                "name": "Phone Repair",
                "category_id": cat.id,
                "description": "Screen replacement",
                "price_min": 500,
                "price_max": 5000,
                "price_unit": "INR",
                "status": "ACTIVE",
            },
            headers=_auth_header(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Phone Repair"
        assert data["price_min"] == 500
        assert data["price_max"] == 5000

    def test_list_services(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Clean", "clean")

        _create_profile(client, token, cat.id)

        for i in range(3):
            client.post(
                "/api/seller/services",
                json={"name": f"Service {i}", "category_id": cat.id},
                headers=_auth_header(token),
            )

        resp = client.get("/api/seller/services", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["total"] == 3

    def test_get_service(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Tutor", "tutor")

        _create_profile(client, token, cat.id)

        create_resp = client.post(
            "/api/seller/services",
            json={"name": "Math Tutoring", "category_id": cat.id, "price_min": 200},
            headers=_auth_header(token),
        )
        service_id = create_resp.json()["id"]

        resp = client.get(f"/api/seller/services/{service_id}", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Math Tutoring"

    def test_update_service(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Gym", "gym")

        _create_profile(client, token, cat.id)

        create_resp = client.post(
            "/api/seller/services",
            json={"name": "Yoga Class", "category_id": cat.id},
            headers=_auth_header(token),
        )
        service_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/seller/services/{service_id}",
            json={"name": "Power Yoga", "price_min": 300, "price_max": 1000},
            headers=_auth_header(token),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Power Yoga"

    def test_delete_service(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Salon", "salon")

        _create_profile(client, token, cat.id)

        create_resp = client.post(
            "/api/seller/services",
            json={"name": "Haircut", "category_id": cat.id},
            headers=_auth_header(token),
        )
        service_id = create_resp.json()["id"]

        resp = client.delete(f"/api/seller/services/{service_id}", headers=_auth_header(token))
        assert resp.status_code == 204

    def test_cannot_access_other_sellers_service(self, client, db):
        email1 = _seller_email()
        email2 = _seller_email()
        _create_seller(db, email1)
        _create_seller(db, email2)
        token1 = _register_and_login(client, email1)
        token2 = _register_and_login(client, email2)
        cat = _ensure_category(db, "Private", "private")

        _create_profile(client, token1, cat.id)
        _create_profile(client, token2, cat.id)

        create_resp = client.post(
            "/api/seller/services",
            json={"name": "Secret Service", "category_id": cat.id},
            headers=_auth_header(token1),
        )
        service_id = create_resp.json()["id"]

        resp = client.get(f"/api/seller/services/{service_id}", headers=_auth_header(token2))
        assert resp.status_code == 403

    def test_service_price_validation(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Price", "price")

        _create_profile(client, token, cat.id)

        # price_min > price_max should fail
        resp = client.post(
            "/api/seller/services",
            json={
                "name": "Bad Range",
                "category_id": cat.id,
                "price_min": 5000,
                "price_max": 100,
            },
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_service_negative_price(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "NegSvc", "negsvc")

        _create_profile(client, token, cat.id)

        resp = client.post(
            "/api/seller/services",
            json={"name": "Neg Price", "category_id": cat.id, "price_min": -500},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422


# ===========================================================================
# 9. Business Hours
# ===========================================================================

class TestSellerBusinessHours:
    def test_list_business_hours_empty(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Hours", "hours")

        _create_profile(client, token, cat.id)

        resp = client.get("/api/seller/business-hours", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_upsert_business_hours(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Hours2", "hours2")

        _create_profile(client, token, cat.id)

        # Create Monday hours
        resp = client.post(
            "/api/seller/business-hours/0",
            json={"day_of_week": 0, "open_time": "09:00", "close_time": "18:00", "is_closed": False},
            headers=_auth_header(token),
        )
        assert resp.status_code == 201
        assert resp.json()["day_of_week"] == 0

        # Update Monday hours
        resp = client.post(
            "/api/seller/business-hours/0",
            json={"day_of_week": 0, "open_time": "10:00", "close_time": "20:00"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 201

    def test_invalid_day_of_week(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Days", "days")

        _create_profile(client, token, cat.id)

        resp = client.post(
            "/api/seller/business-hours/7",
            json={"day_of_week": 7, "open_time": "09:00", "close_time": "18:00"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_invalid_time_format(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Time", "time")

        _create_profile(client, token, cat.id)

        resp = client.post(
            "/api/seller/business-hours/1",
            json={"day_of_week": 1, "open_time": "25:00", "close_time": "18:00"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422


# ===========================================================================
# 10. Enquiries
# ===========================================================================

class TestSellerEnquiries:
    def _setup_enquiry(self, client, db):
        """Create seller, buyer, profile, product, and enquiry."""
        seller_email = _seller_email()
        buyer_email = _buyer_email()
        seller = _create_seller(db, seller_email)
        buyer = _create_buyer(db, buyer_email)
        seller_token = _register_and_login(client, seller_email)
        buyer_token = _register_and_login(client, buyer_email, role="CUSTOMER")

        cat = _ensure_category(db, "EnqCat", "enqcat")
        _create_profile(client, seller_token, cat.id)

        profile_resp = client.get("/api/seller/profile", headers=_auth_header(seller_token))
        profile_id = profile_resp.json()["id"]

        product_resp = client.post(
            "/api/seller/products",
            json={"name": "Enq Product", "category_id": cat.id},
            headers=_auth_header(seller_token),
        )
        product_id = product_resp.json()["id"]

        # Buyer creates enquiry (via direct DB insert since there's no buyer enquiry API yet)
        enquiry = Enquiry(
            buyer_id=buyer.id,
            profile_id=profile_id,
            product_id=product_id,
            message="I'm interested in this product",
            status="NEW",
        )
        db.add(enquiry)
        db.commit()
        db.refresh(enquiry)

        return seller_token, buyer_token, enquiry

    def test_list_enquiries(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        resp = client.get("/api/seller/enquiries", headers=_auth_header(seller_token))
        assert resp.status_code == 200
        assert resp.json()["total"] == 1
        assert resp.json()["items"][0]["message"] == "I'm interested in this product"

    def test_get_enquiry(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        resp = client.get(f"/api/seller/enquiries/{enquiry.id}", headers=_auth_header(seller_token))
        assert resp.status_code == 200
        assert resp.json()["id"] == enquiry.id

    def test_update_enquiry_status(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        resp = client.put(
            f"/api/seller/enquiries/{enquiry.id}/status",
            json={"status": "READ"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "READ"

    def test_invalid_status_transition(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        # NEW -> REPLIED directly should fail (must go through READ first)
        resp = client.put(
            f"/api/seller/enquiries/{enquiry.id}/status",
            json={"status": "REPLIED"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 400

    def test_valid_status_chain(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        # NEW -> READ
        resp = client.put(
            f"/api/seller/enquiries/{enquiry.id}/status",
            json={"status": "READ"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 200

        # READ -> REPLIED
        resp = client.put(
            f"/api/seller/enquiries/{enquiry.id}/status",
            json={"status": "REPLIED"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 200

        # REPLIED -> CLOSED
        resp = client.put(
            f"/api/seller/enquiries/{enquiry.id}/status",
            json={"status": "CLOSED"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 200

    def test_cannot_access_other_sellers_enquiry(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        other_email = _seller_email()
        _create_seller(db, other_email)
        other_token = _register_and_login(client, other_email)

        cat = _ensure_category(db, "OtherEnq", "otherenq")
        _create_profile(client, other_token, cat.id)

        resp = client.get(f"/api/seller/enquiries/{enquiry.id}", headers=_auth_header(other_token))
        assert resp.status_code == 403

    def test_enquiry_filter_by_status(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        resp = client.get(
            "/api/seller/enquiries",
            params={"status": "NEW"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 200
        assert resp.json()["total"] == 1

        resp = client.get(
            "/api/seller/enquiries",
            params={"status": "CLOSED"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 200
        assert resp.json()["total"] == 0


# ===========================================================================
# 11. Quotations
# ===========================================================================

class TestSellerQuotations:
    def _setup_enquiry(self, client, db):
        seller_email = _seller_email()
        buyer_email = _buyer_email()
        seller = _create_seller(db, seller_email)
        buyer = _create_buyer(db, buyer_email)
        seller_token = _register_and_login(client, seller_email)
        buyer_token = _register_and_login(client, buyer_email, role="CUSTOMER")

        cat = _ensure_category(db, "QuoteCat", "quotecat")
        _create_profile(client, seller_token, cat.id)

        profile_resp = client.get("/api/seller/profile", headers=_auth_header(seller_token))
        profile_id = profile_resp.json()["id"]

        enquiry = Enquiry(
            buyer_id=buyer.id,
            profile_id=profile_id,
            message="Need a quote",
            status="NEW",
        )
        db.add(enquiry)
        db.commit()
        db.refresh(enquiry)

        return seller_token, buyer_token, enquiry

    def test_create_quotation(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        resp = client.post(
            "/api/seller/quotations",
            json={
                "enquiry_id": enquiry.id,
                "amount": 5000,
                "description": "Special price for you",
                "valid_until": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            },
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["amount"] == 5000
        assert data["status"] == "PENDING"

    def test_create_quotation_updates_enquiry_status(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        client.post(
            "/api/seller/quotations",
            json={"enquiry_id": enquiry.id, "amount": 3000},
            headers=_auth_header(seller_token),
        )

        # Check enquiry status updated to REPLIED
        resp = client.get(f"/api/seller/enquiries/{enquiry.id}", headers=_auth_header(seller_token))
        assert resp.json()["status"] == "REPLIED"

    def test_list_quotations(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        client.post(
            "/api/seller/quotations",
            json={"enquiry_id": enquiry.id, "amount": 2000},
            headers=_auth_header(seller_token),
        )

        resp = client.get("/api/seller/quotations", headers=_auth_header(seller_token))
        assert resp.status_code == 200
        assert resp.json()["total"] == 1

    def test_get_quotation(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        create_resp = client.post(
            "/api/seller/quotations",
            json={"enquiry_id": enquiry.id, "amount": 7500},
            headers=_auth_header(seller_token),
        )
        quote_id = create_resp.json()["id"]

        resp = client.get(f"/api/seller/quotations/{quote_id}", headers=_auth_header(seller_token))
        assert resp.status_code == 200
        assert resp.json()["amount"] == 7500

    def test_cancel_quotation(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        create_resp = client.post(
            "/api/seller/quotations",
            json={"enquiry_id": enquiry.id, "amount": 4000},
            headers=_auth_header(seller_token),
        )
        quote_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/seller/quotations/{quote_id}",
            json={"status": "CANCELLED"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "CANCELLED"

    def test_cannot_cancel_accepted_quotation(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        create_resp = client.post(
            "/api/seller/quotations",
            json={"enquiry_id": enquiry.id, "amount": 6000},
            headers=_auth_header(seller_token),
        )
        quote_id = create_resp.json()["id"]

        # Manually set to ACCEPTED
        quote = db.get(Quotation, quote_id)
        quote.status = "ACCEPTED"
        db.commit()

        resp = client.put(
            f"/api/seller/quotations/{quote_id}",
            json={"status": "CANCELLED"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 400

    def test_quotation_amount_validation(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        resp = client.post(
            "/api/seller/quotations",
            json={"enquiry_id": enquiry.id, "amount": -100},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 422

    def test_cannot_access_other_sellers_quotation(self, client, db):
        seller_token, buyer_token, enquiry = self._setup_enquiry(client, db)

        create_resp = client.post(
            "/api/seller/quotations",
            json={"enquiry_id": enquiry.id, "amount": 8000},
            headers=_auth_header(seller_token),
        )
        quote_id = create_resp.json()["id"]

        other_email = _seller_email()
        _create_seller(db, other_email)
        other_token = _register_and_login(client, other_email)

        cat = _ensure_category(db, "OtherQuote", "otherquote")
        _create_profile(client, other_token, cat.id)

        resp = client.get(f"/api/seller/quotations/{quote_id}", headers=_auth_header(other_token))
        assert resp.status_code == 403


# ===========================================================================
# 12. Requirements
# ===========================================================================

class TestSellerRequirements:
    def _setup_requirement(self, client, db, city="Delhi"):
        buyer_email = _buyer_email()
        buyer = _create_buyer(db, buyer_email)
        buyer_token = _register_and_login(client, buyer_email, role="CUSTOMER")

        seller_email = _seller_email()
        _create_seller(db, seller_email)
        seller_token = _register_and_login(client, seller_email)

        cat = _ensure_category(db, "ReqCat", "reqcat")

        requirement = Requirement(
            buyer_id=buyer.id,
            title=f"Need 100 widgets in {city}",
            description="Bulk order for widgets",
            category_id=cat.id,
            city=city,
            status="OPEN",
            budget=50000,
        )
        db.add(requirement)
        db.commit()
        db.refresh(requirement)

        return seller_token, buyer_token, requirement

    def test_list_requirements(self, client, db):
        seller_token, buyer_token, requirement = self._setup_requirement(client, db, city="DelhiReq")

        resp = client.get("/api/seller/requirements", headers=_auth_header(seller_token))
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    def test_get_requirement(self, client, db):
        seller_token, buyer_token, requirement = self._setup_requirement(client, db, city="MumbaiReq")

        resp = client.get(f"/api/seller/requirements/{requirement.id}", headers=_auth_header(seller_token))
        assert resp.status_code == 200
        assert resp.json()["budget"] == 50000

    def test_filter_requirements_by_city(self, client, db):
        seller_token, buyer_token, requirement = self._setup_requirement(client, db, city="ChennaiReq")

        resp = client.get(
            "/api/seller/requirements",
            params={"city": "ChennaiReq"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

        resp = client.get(
            "/api/seller/requirements",
            params={"city": "NonexistentCityXYZ"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    def test_only_open_requirements_visible(self, client, db):
        seller_token, buyer_token, requirement = self._setup_requirement(client, db, city="ClosedReq")

        # Close the requirement
        requirement.status = "CLOSED"
        db.commit()

        resp = client.get(
            "/api/seller/requirements",
            params={"city": "ClosedReq"},
            headers=_auth_header(seller_token),
        )
        assert resp.json()["total"] == 0


# ===========================================================================
# 13. Messages
# ===========================================================================

class TestSellerMessages:
    def _setup_conversation(self, client, db):
        seller_email = _seller_email()
        buyer_email = _buyer_email()
        seller = _create_seller(db, seller_email)
        buyer = _create_buyer(db, buyer_email)
        seller_token = _register_and_login(client, seller_email)
        buyer_token = _register_and_login(client, buyer_email, role="CUSTOMER")
        return seller_token, buyer_token, seller, buyer

    def test_send_message(self, client, db):
        seller_token, buyer_token, seller, buyer = self._setup_conversation(client, db)

        resp = client.post(
            "/api/seller/messages",
            json={"receiver_id": buyer.id, "content": "Hello buyer!"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["content"] == "Hello buyer!"
        assert data["sender_id"] == seller.id
        assert data["receiver_id"] == buyer.id

    def test_list_conversations(self, client, db):
        seller_token, buyer_token, seller, buyer = self._setup_conversation(client, db)

        # Send a message
        client.post(
            "/api/seller/messages",
            json={"receiver_id": buyer.id, "content": "Test message"},
            headers=_auth_header(seller_token),
        )

        resp = client.get("/api/seller/messages/conversations", headers=_auth_header(seller_token))
        assert resp.status_code == 200
        conversations = resp.json()
        assert len(conversations) == 1
        assert conversations[0]["partner_id"] == buyer.id
        assert conversations[0]["unread_count"] == 0

    def test_get_messages(self, client, db):
        seller_token, buyer_token, seller, buyer = self._setup_conversation(client, db)

        # Send messages
        client.post(
            "/api/seller/messages",
            json={"receiver_id": buyer.id, "content": "Message 1"},
            headers=_auth_header(seller_token),
        )
        client.post(
            "/api/seller/messages",
            json={"receiver_id": buyer.id, "content": "Message 2"},
            headers=_auth_header(seller_token),
        )

        resp = client.get(
            f"/api/seller/messages/{buyer.id}",
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 200
        assert resp.json()["total"] == 2

    def test_mark_messages_read(self, client, db):
        seller_token, buyer_token, seller, buyer = self._setup_conversation(client, db)

        # Buyer sends to seller
        client.post(
            "/api/auth/login",
            json={"email": buyer.email, "password": "BuyerPass123!"},
        )
        # Direct DB insert for buyer message
        msg = Message(sender_id=buyer.id, receiver_id=seller.id, content="From buyer", is_read=False)
        db.add(msg)
        db.commit()

        # Seller marks as read
        resp = client.put(
            f"/api/seller/messages/{buyer.id}/read",
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 200
        assert resp.json()["marked_read"] == 1

    def test_cannot_message_self(self, client, db):
        seller_token, buyer_token, seller, buyer = self._setup_conversation(client, db)

        resp = client.post(
            "/api/seller/messages",
            json={"receiver_id": seller.id, "content": "Self message"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 400

    def test_message_empty_content_rejected(self, client, db):
        seller_token, buyer_token, seller, buyer = self._setup_conversation(client, db)

        resp = client.post(
            "/api/seller/messages",
            json={"receiver_id": buyer.id, "content": ""},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 422

    def test_message_to_nonexistent_user(self, client, db):
        seller_token, buyer_token, seller, buyer = self._setup_conversation(client, db)

        resp = client.post(
            "/api/seller/messages",
            json={"receiver_id": 99999, "content": "Ghost message"},
            headers=_auth_header(seller_token),
        )
        assert resp.status_code == 400


# ===========================================================================
# 14. Profile Settings
# ===========================================================================

class TestSellerProfileSettings:
    def test_get_settings(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)

        resp = client.get("/api/seller/settings", headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == email
        assert data["full_name"] is not None

    def test_update_settings(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)

        resp = client.put(
            "/api/seller/settings",
            json={"full_name": "Updated Name", "city": "Pune"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "Updated Name"
        assert resp.json()["city"] == "Pune"

    def test_settings_no_password_hash(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)

        resp = client.get("/api/seller/settings", headers=_auth_header(token))
        assert "password_hash" not in resp.json()

    def test_full_name_validation(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)

        resp = client.put(
            "/api/seller/settings",
            json={"full_name": ""},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422


# ===========================================================================
# 15. Ownership enforcement
# ===========================================================================

class TestSellerOwnership:
    def test_seller_cannot_access_other_profile(self, client, db):
        email1 = _seller_email()
        email2 = _seller_email()
        _create_seller(db, email1)
        _create_seller(db, email2)
        token1 = _register_and_login(client, email1)
        token2 = _register_and_login(client, email2)

        cat = _ensure_category(db, "Own1", "own1")
        _create_profile(client, token1, cat.id)
        _create_profile(client, token2, cat.id)

        # Each gets their own profile
        resp1 = client.get("/api/seller/profile", headers=_auth_header(token1))
        resp2 = client.get("/api/seller/profile", headers=_auth_header(token2))
        assert resp1.json()["id"] != resp2.json()["id"]

    def test_buyer_cannot_access_seller_endpoints(self, client, db):
        email = _buyer_email()
        _create_buyer(db, email)
        token = _register_and_login(client, email, role="CUSTOMER")

        endpoints = [
            ("GET", "/api/seller/profile"),
            ("POST", "/api/seller/profile"),
            ("GET", "/api/seller/products"),
            ("POST", "/api/seller/products"),
            ("GET", "/api/seller/services"),
            ("POST", "/api/seller/services"),
            ("GET", "/api/seller/enquiries"),
            ("GET", "/api/seller/quotations"),
            ("GET", "/api/seller/requirements"),
            ("GET", "/api/seller/messages/conversations"),
            ("GET", "/api/seller/settings"),
        ]

        for method, path in endpoints:
            if method == "GET":
                resp = client.get(path, headers=_auth_header(token))
            else:
                resp = client.post(path, json={}, headers=_auth_header(token))
            assert resp.status_code == 403, f"{method} {path} should return 403 for buyer"

    def test_unauthenticated_cannot_access_seller_endpoints(self, client):
        endpoints = [
            "/api/seller/profile",
            "/api/seller/products",
            "/api/seller/services",
            "/api/seller/enquiries",
            "/api/seller/quotations",
            "/api/seller/requirements",
            "/api/seller/messages/conversations",
            "/api/seller/settings",
        ]

        for path in endpoints:
            resp = client.get(path)
            assert resp.status_code in (401, 403), f"{path} should reject unauthenticated"


# ===========================================================================
# 16. Validation edge cases
# ===========================================================================

class TestSellerValidation:
    def test_business_name_too_long(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Long", "long")

        resp = client.post(
            "/api/seller/profile",
            json={"business_name": "x" * 256, "category_id": cat.id},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_product_name_empty(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Empty", "empty")

        _create_profile(client, token, cat.id)

        resp = client.post(
            "/api/seller/products",
            json={"name": "", "category_id": cat.id},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_service_name_too_long(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "LongSvc", "longsvc")

        _create_profile(client, token, cat.id)

        resp = client.post(
            "/api/seller/services",
            json={"name": "x" * 256, "category_id": cat.id},
            headers=_auth_header(token),
        )
        assert resp.status_code == 422

    def test_pagination_invalid_page(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)

        resp = client.get("/api/seller/products?page=0", headers=_auth_header(token))
        assert resp.status_code == 422

    def test_pagination_invalid_page_size(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)

        resp = client.get("/api/seller/products?page_size=200", headers=_auth_header(token))
        assert resp.status_code == 422


# ===========================================================================
# 17. Dashboard stats accuracy
# ===========================================================================

class TestSellerDashboardAccuracy:
    def test_dashboard_reflects_new_enquiry(self, client, db):
        seller_email = _seller_email()
        buyer_email = _buyer_email()
        seller = _create_seller(db, seller_email)
        buyer = _create_buyer(db, buyer_email)
        seller_token = _register_and_login(client, seller_email)
        buyer_token = _register_and_login(client, buyer_email, role="CUSTOMER")

        cat = _ensure_category(db, "DashCat", "dashcat")
        _create_profile(client, seller_token, cat.id)

        profile_resp = client.get("/api/seller/profile", headers=_auth_header(seller_token))
        profile_id = profile_resp.json()["id"]

        # Check dashboard before enquiry
        resp = client.get("/api/seller/dashboard", headers=_auth_header(seller_token))
        assert resp.json()["new_enquiries"] == 0

        # Create enquiry
        enquiry = Enquiry(
            buyer_id=buyer.id,
            profile_id=profile_id,
            message="Test enquiry",
            status="NEW",
        )
        db.add(enquiry)
        db.commit()

        # Check dashboard after enquiry
        resp = client.get("/api/seller/dashboard", headers=_auth_header(seller_token))
        assert resp.json()["new_enquiries"] == 1

    def test_dashboard_reflects_quotation_status(self, client, db):
        seller_email = _seller_email()
        buyer_email = _buyer_email()
        seller = _create_seller(db, seller_email)
        buyer = _create_buyer(db, buyer_email)
        seller_token = _register_and_login(client, seller_email)
        buyer_token = _register_and_login(client, buyer_email, role="CUSTOMER")

        cat = _ensure_category(db, "DashQuote", "dashquote")
        _create_profile(client, seller_token, cat.id)

        profile_resp = client.get("/api/seller/profile", headers=_auth_header(seller_token))
        profile_id = profile_resp.json()["id"]

        enquiry = Enquiry(
            buyer_id=buyer.id,
            profile_id=profile_id,
            message="Need quote",
            status="NEW",
        )
        db.add(enquiry)
        db.commit()
        db.refresh(enquiry)

        # Create quotation
        client.post(
            "/api/seller/quotations",
            json={"enquiry_id": enquiry.id, "amount": 5000},
            headers=_auth_header(seller_token),
        )

        # Check pending quotations
        resp = client.get("/api/seller/dashboard", headers=_auth_header(seller_token))
        assert resp.json()["pending_quotations"] == 1
        assert resp.json()["accepted_quotations"] == 0

        # Accept quotation
        quote = db.query(Quotation).filter(Quotation.enquiry_id == enquiry.id).first()
        quote.status = "ACCEPTED"
        db.commit()

        resp = client.get("/api/seller/dashboard", headers=_auth_header(seller_token))
        assert resp.json()["pending_quotations"] == 0
        assert resp.json()["accepted_quotations"] == 1

    def test_dashboard_profile_completion(self, client, db):
        email = _seller_email()
        _create_seller(db, email)
        token = _register_and_login(client, email)
        cat = _ensure_category(db, "Completion", "completion")

        # Minimal profile
        _create_profile(client, token, cat.id, description=None, phone=None)

        resp = client.get("/api/seller/dashboard", headers=_auth_header(token))
        completion_minimal = resp.json()["profile_completion"]

        # Update with more fields
        client.put(
            "/api/seller/profile",
            json={
                "description": "A great business",
                "phone": "+911234567890",
                "email": "full@test.com",
                "website": "https://example.com",
                "address": "123 Main St",
                "city": "Mumbai",
                "logo_url": "/uploads/logo.png",
                "cover_image_url": "/uploads/cover.jpg",
            },
            headers=_auth_header(token),
        )

        resp = client.get("/api/seller/dashboard", headers=_auth_header(token))
        completion_full = resp.json()["profile_completion"]
        assert completion_full > completion_minimal
