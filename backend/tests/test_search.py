import math
import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base, get_db
from app.dependencies.database import get_db_session
from app.main import app
from app.models.biz_profile import BizProfile
from app.models.category import Category, Subcategory
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.services.jwt import create_access_token
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

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_db_session] = override_get_db
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
def admin_role(db):
    role = Role(name=RoleEnum.ADMIN.value, description="Admin user")
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@pytest.fixture()
def test_user(db, user_role):
    user = User(
        role_id=user_role.id,
        full_name="Test User",
        email="test@example.com",
        password_hash=hash_password("TestPass123!"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


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
def user_token(test_user):
    return create_access_token(user_id=test_user.id, role_name=RoleEnum.USER.value)


@pytest.fixture()
def admin_token(admin_user):
    return create_access_token(user_id=admin_user.id, role_name=RoleEnum.ADMIN.value)


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _create_profile(client, token, **overrides):
    """Create a profile via the API and return the response JSON."""
    data = {
        "category_id": overrides.get("category_id", 1),
        "profile_type": overrides.get("profile_type", "COMPANY"),
        "business_name": overrides.get("business_name", "Test Co"),
        "slug": overrides.get("slug", "test-co"),
        "is_public": overrides.get("is_public", True),
        "city": overrides.get("city"),
        "state": overrides.get("state"),
        "country": overrides.get("country"),
        "pincode": overrides.get("pincode"),
        "latitude": overrides.get("latitude"),
        "longitude": overrides.get("longitude"),
        "description": overrides.get("description"),
        "subcategory_id": overrides.get("subcategory_id"),
    }
    data = {k: v for k, v in data.items() if v is not None}
    if data.get("profile_type") == "COMPANY" and "company_detail" not in data:
        data["company_detail"] = {"company_registration_number": "REG123", "legal_name": data.get("business_name", "Test"), "company_type": "LLC"}
    elif data.get("profile_type") == "INDIVIDUAL" and "individual_detail" not in data:
        data["individual_detail"] = {"professional_name": data.get("business_name", "Test"), "profession": "Developer"}
    elif data.get("profile_type") == "MSME" and "msme_detail" not in data:
        data["msme_detail"] = {"msme_number": "MSME123", "business_type": "Manufacturing", "industry": "General"}
    resp = client.post("/api/profiles", json=data, headers=_auth(token))
    assert resp.status_code == 201, f"Profile creation failed: {resp.text}"
    return resp.json()


def _create_category_db(db, name, slug):
    """Insert a category directly into the database."""
    cat = Category(name=name, slug=slug)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def _create_subcategory_db(db, category_id, name, slug):
    """Insert a subcategory directly into the database."""
    sub = Subcategory(category_id=category_id, name=name, slug=slug)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


# ====================================================================
# Test: Keyword Search
# ====================================================================


class TestKeywordSearch:
    def test_search_by_business_name(self, client, db, user_token):
        cat = _create_category_db(db, "Technology", "technology-kw1")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Acme Tech Solutions",
            slug="acme-tech-kw1",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Beta Corp",
            slug="beta-corp-kw1",
        )

        resp = client.get("/api/search", params={"q": "Acme"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "Acme Tech Solutions"

    def test_search_by_description(self, client, db, user_token):
        cat = _create_category_db(db, "Hosting", "hosting-kw2")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Cloud Host",
            slug="cloud-host-kw2",
            description="We provide cloud hosting services",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Other Co",
            slug="other-co-kw2",
            description="We do something else entirely",
        )

        resp = client.get("/api/search", params={"q": "cloud hosting"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "Cloud Host"

    def test_search_by_category_name(self, client, db, user_token):
        cat = _create_category_db(db, "Healthcare", "healthcare-kw3")
        other = _create_category_db(db, "Finance", "finance-kw3")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Medi Clinic",
            slug="medi-clinic-kw3",
        )
        _create_profile(
            client,
            user_token,
            category_id=other.id,
            business_name="Money Bank",
            slug="money-bank-kw3",
        )

        resp = client.get("/api/search", params={"q": "Healthcare"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "Medi Clinic"

    def test_search_by_subcategory_name(self, client, db, user_token):
        cat = _create_category_db(db, "Technology", "technology-kw4")
        sub = _create_subcategory_db(db, cat.id, "Web Development", "web-dev-kw4")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            subcategory_id=sub.id,
            business_name="Dev Studio",
            slug="dev-studio-kw4",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="General Tech",
            slug="general-tech-kw4",
        )

        resp = client.get("/api/search", params={"q": "Web Development"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "Dev Studio"

    def test_search_by_city(self, client, db, user_token):
        cat = _create_category_db(db, "Retail", "retail-kw5")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="NYC Shop",
            slug="nyc-shop-kw5",
            city="New York",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="LA Shop",
            slug="la-shop-kw5",
            city="Los Angeles",
        )

        resp = client.get("/api/search", params={"q": "New York"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["city"] == "New York"

    def test_search_by_state(self, client, db, user_token):
        cat = _create_category_db(db, "Services", "services-kw6")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="NY Services",
            slug="ny-svc-kw6",
            state="New York",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="CA Services",
            slug="ca-svc-kw6",
            state="California",
        )

        resp = client.get("/api/search", params={"q": "New York"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["state"] == "New York"

    def test_search_by_pincode(self, client, db, user_token):
        cat = _create_category_db(db, "Logistics", "logistics-kw7")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Pin One",
            slug="pin-one-kw7",
            pincode="10001",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Pin Two",
            slug="pin-two-kw7",
            pincode="90210",
        )

        resp = client.get("/api/search", params={"q": "10001"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["pincode"] == "10001"

    def test_search_is_case_insensitive(self, client, db, user_token):
        cat = _create_category_db(db, "Auto", "auto-kw8")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Acme Corp",
            slug="acme-case-kw8",
        )

        resp = client.get("/api/search", params={"q": "ACME"})
        assert resp.status_code == 200
        assert resp.json()["total"] == 1

    def test_search_no_results(self, client, db, user_token):
        cat = _create_category_db(db, "Misc", "misc-kw9")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Acme Corp",
            slug="acme-none-kw9",
        )

        resp = client.get("/api/search", params={"q": "Nonexistent"})
        assert resp.status_code == 200
        assert resp.json()["total"] == 0
        assert resp.json()["items"] == []


# ====================================================================
# Test: Category Filter
# ====================================================================


class TestCategoryFilter:
    def test_filter_by_category(self, client, db, user_token):
        tech = _create_category_db(db, "Technology", "technology-cat1")
        food = _create_category_db(db, "Food", "food-cat1")
        _create_profile(
            client,
            user_token,
            category_id=tech.id,
            business_name="Tech Co",
            slug="tech-co-cat1",
        )
        _create_profile(
            client,
            user_token,
            category_id=food.id,
            business_name="Food Co",
            slug="food-co-cat1",
        )

        resp = client.get("/api/search", params={"category_id": tech.id})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "Tech Co"

    def test_filter_by_subcategory(self, client, db, user_token):
        cat = _create_category_db(db, "Technology", "technology-cat2")
        sub = _create_subcategory_db(db, cat.id, "Web Development", "web-dev-cat2")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            subcategory_id=sub.id,
            business_name="Web Dev Co",
            slug="web-dev-co-cat2",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="General Tech Co",
            slug="general-tech-cat2",
        )

        resp = client.get("/api/search", params={"subcategory_id": sub.id})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "Web Dev Co"

    def test_filter_by_profile_type(self, client, db, user_token):
        cat = _create_category_db(db, "Business", "business-cat3")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            profile_type="COMPANY",
            business_name="Company Co",
            slug="company-co-cat3",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            profile_type="INDIVIDUAL",
            business_name="Individual Pro",
            slug="individual-pro-cat3",
            individual_detail={"profession": "Developer"},
        )

        resp = client.get("/api/search", params={"profile_type": "COMPANY"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "Company Co"


# ====================================================================
# Test: Location Filter
# ====================================================================


class TestLocationFilter:
    def test_filter_by_city(self, client, db, user_token):
        cat = _create_category_db(db, "Retail", "retail-loc1")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="NYC Co",
            slug="nyc-co-loc1",
            city="New York",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="LA Co",
            slug="la-co-loc1",
            city="Los Angeles",
        )

        resp = client.get("/api/search", params={"city": "New York"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["city"] == "New York"

    def test_filter_by_state(self, client, db, user_token):
        cat = _create_category_db(db, "Services", "services-loc2")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="NY Co",
            slug="ny-co-loc2",
            state="New York",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="CA Co",
            slug="ca-co-loc2",
            state="California",
        )

        resp = client.get("/api/search", params={"state": "New York"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["state"] == "New York"

    def test_filter_by_country(self, client, db, user_token):
        cat = _create_category_db(db, "Trade", "trade-loc3")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="US Co",
            slug="us-co-loc3",
            country="USA",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="UK Co",
            slug="uk-co-loc3",
            country="UK",
        )

        resp = client.get("/api/search", params={"country": "USA"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["country"] == "USA"

    def test_filter_by_pincode(self, client, db, user_token):
        cat = _create_category_db(db, "Local", "local-loc4")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Pin1 Co",
            slug="pin1-co-loc4",
            pincode="10001",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Pin2 Co",
            slug="pin2-co-loc4",
            pincode="90210",
        )

        resp = client.get("/api/search", params={"pincode": "10001"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["pincode"] == "10001"

    def test_city_filter_is_partial_match(self, client, db, user_token):
        cat = _create_category_db(db, "Shop", "shop-loc5")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="York Co",
            slug="york-co-loc5",
            city="New York",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="LA Co",
            slug="la-co-loc5",
            city="Los Angeles",
        )

        resp = client.get("/api/search", params={"city": "York"})
        assert resp.status_code == 200
        assert resp.json()["total"] == 1


# ====================================================================
# Test: Pagination
# ====================================================================


class TestSearchPagination:
    def test_pagination_page_1(self, client, db, user_token):
        cat = _create_category_db(db, "Biz", "biz-pag1")
        for i in range(5):
            _create_profile(
                client,
                user_token,
                category_id=cat.id,
                business_name=f"Biz {i}",
                slug=f"biz-pag1-{i}",
            )

        resp = client.get(
            "/api/search",
            params={"category_id": cat.id, "page": 1, "page_size": 2},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 5
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert data["total_pages"] == 3
        assert len(data["items"]) == 2

    def test_pagination_page_2(self, client, db, user_token):
        cat = _create_category_db(db, "Biz2", "biz-pag2")
        for i in range(5):
            _create_profile(
                client,
                user_token,
                category_id=cat.id,
                business_name=f"Biz {i}",
                slug=f"biz-pag2-{i}",
            )

        resp = client.get(
            "/api/search",
            params={"category_id": cat.id, "page": 2, "page_size": 2},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 2
        assert data["page"] == 2

    def test_empty_page_returns_empty_items(self, client, db, user_token):
        cat = _create_category_db(db, "Single", "single-pag3")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Only",
            slug="only-pag3",
        )

        resp = client.get(
            "/api/search",
            params={"category_id": cat.id, "page": 10, "page_size": 2},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"] == []

    def test_total_pages_calculation(self, client, db, user_token):
        cat = _create_category_db(db, "Exact", "exact-pag4")
        for i in range(6):
            _create_profile(
                client,
                user_token,
                category_id=cat.id,
                business_name=f"Item {i}",
                slug=f"item-pag4-{i}",
            )

        resp = client.get(
            "/api/search",
            params={"category_id": cat.id, "page": 1, "page_size": 3},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 6
        assert data["total_pages"] == 2


# ====================================================================
# Test: Empty Results
# ====================================================================


class TestEmptyResults:
    def test_empty_database(self, client):
        resp = client.get("/api/search", params={"q": "anything"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["items"] == []
        assert data["total_pages"] == 0

    def test_no_match_for_filter(self, client, db, user_token):
        cat = _create_category_db(db, "Food", "food-emp1")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Pizza Place",
            slug="pizza-emp1",
        )

        resp = client.get("/api/search", params={"q": "Automotive"})
        assert resp.status_code == 200
        assert resp.json()["total"] == 0
        assert resp.json()["items"] == []


# ====================================================================
# Test: Nearby Results
# ====================================================================


class TestNearbySearch:
    def test_nearby_returns_distance(self, client, db, user_token):
        cat = _create_category_db(db, "Food", "food-near1")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Close",
            slug="close-near1",
            latitude=40.7585,
            longitude=-73.9850,
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Far",
            slug="far-near1",
            latitude=40.8000,
            longitude=-73.9500,
        )

        resp = client.get(
            "/api/search",
            params={
                "latitude": 40.7580,
                "longitude": -73.9855,
                "radius_km": 10,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert data["items"][0]["distance_km"] is not None
        assert data["items"][0]["business_name"] == "Close"
        assert data["items"][1]["business_name"] == "Far"
        assert data["items"][0]["distance_km"] < data["items"][1]["distance_km"]

    def test_nearby_excludes_out_of_range(self, client, db, user_token):
        cat = _create_category_db(db, "Shop", "shop-near2")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Close",
            slug="close-near2",
            latitude=40.7585,
            longitude=-73.9850,
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Very Far",
            slug="very-far-near2",
            latitude=51.5074,
            longitude=-0.1278,
        )

        resp = client.get(
            "/api/search",
            params={
                "latitude": 40.7580,
                "longitude": -73.9855,
                "radius_km": 5,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "Close"

    def test_nearby_with_keyword(self, client, db, user_token):
        cat = _create_category_db(db, "Dining", "dining-near3")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Pizza Place",
            slug="pizza-near3",
            latitude=40.7585,
            longitude=-73.9850,
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Burger Joint",
            slug="burger-near3",
            latitude=40.7590,
            longitude=-73.9860,
        )

        resp = client.get(
            "/api/search",
            params={
                "q": "Pizza",
                "latitude": 40.7580,
                "longitude": -73.9855,
                "radius_km": 5,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "Pizza Place"

    def test_nearby_with_category_filter(self, client, db, user_token):
        food = _create_category_db(db, "Food", "food-near4")
        tech = _create_category_db(db, "Tech", "tech-near4")
        _create_profile(
            client,
            user_token,
            category_id=food.id,
            business_name="Restaurant",
            slug="restaurant-near4",
            latitude=40.7585,
            longitude=-73.9850,
        )
        _create_profile(
            client,
            user_token,
            category_id=tech.id,
            business_name="Tech Shop",
            slug="tech-shop-near4",
            latitude=40.7588,
            longitude=-73.9855,
        )

        resp = client.get(
            "/api/search",
            params={
                "category_id": food.id,
                "latitude": 40.7580,
                "longitude": -73.9855,
                "radius_km": 5,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "Restaurant"


# ====================================================================
# Test: Visibility Rules
# ====================================================================


class TestVisibilityRules:
    def test_private_profiles_excluded(self, client, db, user_token):
        cat = _create_category_db(db, "Public", "public-vis1")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Public",
            slug="public-vis1",
            is_public=True,
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Private",
            slug="private-vis1",
            is_public=False,
        )

        resp = client.get("/api/search", params={"q": "Public"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "Public"

    def test_no_results_for_private_search(self, client, db, user_token):
        cat = _create_category_db(db, "Secret", "secret-vis2")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Secret Co",
            slug="secret-co-vis2",
            is_public=False,
        )

        resp = client.get("/api/search", params={"q": "Secret"})
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    def test_only_active_profiles_returned(self, client, db, user_token):
        cat = _create_category_db(db, "Active", "active-vis3")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Active Co",
            slug="active-co-vis3",
            is_public=True,
        )
        resp = client.get("/api/search", params={"q": "Active"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["is_active"] is True


# ====================================================================
# Test: Combined Filters
# ====================================================================


class TestCombinedFilters:
    def test_keyword_and_category(self, client, db, user_token):
        tech = _create_category_db(db, "Technology", "technology-comb1")
        food = _create_category_db(db, "Food", "food-comb1")
        _create_profile(
            client,
            user_token,
            category_id=tech.id,
            business_name="Acme Tech",
            slug="acme-tech-comb1",
        )
        _create_profile(
            client,
            user_token,
            category_id=food.id,
            business_name="Acme Food",
            slug="acme-food-comb1",
        )

        resp = client.get(
            "/api/search", params={"q": "Acme", "category_id": tech.id}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "Acme Tech"

    def test_keyword_and_city(self, client, db, user_token):
        cat = _create_category_db(db, "Biz", "biz-comb2")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Acme NYC",
            slug="acme-nyc-comb2",
            city="New York",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Acme LA",
            slug="acme-la-comb2",
            city="Los Angeles",
        )

        resp = client.get(
            "/api/search", params={"q": "Acme", "city": "New York"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["city"] == "New York"

    def test_category_and_state(self, client, db, user_token):
        tech = _create_category_db(db, "Tech", "tech-comb3")
        food = _create_category_db(db, "Food", "food-comb3")
        _create_profile(
            client,
            user_token,
            category_id=tech.id,
            business_name="NY Tech",
            slug="ny-tech-comb3",
            state="New York",
        )
        _create_profile(
            client,
            user_token,
            category_id=food.id,
            business_name="NY Food",
            slug="ny-food-comb3",
            state="New York",
        )
        _create_profile(
            client,
            user_token,
            category_id=tech.id,
            business_name="CA Tech",
            slug="ca-tech-comb3",
            state="California",
        )

        resp = client.get(
            "/api/search", params={"category_id": tech.id, "state": "New York"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "NY Tech"

    def test_all_filters_combined(self, client, db, user_token):
        cat = _create_category_db(db, "Design", "design-comb4")
        sub = _create_subcategory_db(db, cat.id, "UI/UX", "uiux-comb4")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            subcategory_id=sub.id,
            business_name="Acme Design Studio",
            slug="acme-design-comb4",
            city="San Francisco",
            state="California",
            country="USA",
            pincode="94102",
        )
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Beta Design",
            slug="beta-design-comb4",
            city="New York",
            state="New York",
            country="USA",
            pincode="10001",
        )

        resp = client.get(
            "/api/search",
            params={
                "q": "Acme",
                "category_id": cat.id,
                "subcategory_id": sub.id,
                "city": "San Francisco",
                "state": "California",
                "country": "USA",
                "pincode": "94102",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["business_name"] == "Acme Design Studio"


# ====================================================================
# Test: Validation
# ====================================================================


class TestSearchValidation:
    def test_invalid_latitude(self, client):
        resp = client.get("/api/search", params={"latitude": 91, "longitude": 0})
        assert resp.status_code == 422

    def test_invalid_longitude(self, client):
        resp = client.get("/api/search", params={"latitude": 0, "longitude": 181})
        assert resp.status_code == 422

    def test_radius_over_100_rejected(self, client):
        resp = client.get(
            "/api/search", params={"latitude": 0, "longitude": 0, "radius_km": 101}
        )
        assert resp.status_code == 422

    def test_page_size_over_100_rejected(self, client):
        resp = client.get("/api/search", params={"page_size": 101})
        assert resp.status_code == 422

    def test_page_zero_rejected(self, client):
        resp = client.get("/api/search", params={"page": 0})
        assert resp.status_code == 422

    def test_negative_page_rejected(self, client):
        resp = client.get("/api/search", params={"page": -1})
        assert resp.status_code == 422

    def test_negative_radius_rejected(self, client):
        resp = client.get(
            "/api/search", params={"latitude": 0, "longitude": 0, "radius_km": -5}
        )
        assert resp.status_code == 422


# ====================================================================
# Test: Response Structure
# ====================================================================


class TestResponseStructure:
    def test_response_has_required_fields(self, client):
        resp = client.get("/api/search")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data

    def test_item_has_required_fields(self, client, db, user_token):
        cat = _create_category_db(db, "Test", "test-struct1")
        _create_profile(
            client,
            user_token,
            category_id=cat.id,
            business_name="Struct Co",
            slug="struct-co-struct1",
        )

        resp = client.get("/api/search", params={"q": "Struct"})
        assert resp.status_code == 200
        item = resp.json()["items"][0]
        for field in [
            "id",
            "user_id",
            "category_id",
            "profile_type",
            "business_name",
            "slug",
            "is_public",
            "is_verified",
            "is_active",
            "created_at",
            "updated_at",
            "distance_km",
        ]:
            assert field in item, f"Missing field: {field}"

    def test_empty_response_structure(self, client):
        resp = client.get("/api/search", params={"q": "zzz_no_match_zzz"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["total_pages"] == 0
