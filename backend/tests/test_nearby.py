import math
import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base, get_db
from app.main import app
from app.models.biz_profile import BizProfile
from app.models.category import Category
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
def user_role(db):
    role = Role(name=RoleEnum.USER.value, description="Standard user")
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
def test_category(db):
    cat = Category(name="Restaurants", slug="restaurants")
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def _login(client, email, password):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _create_profile(client, token, category_id, name, slug, lat, lng, is_public=True):
    return client.post(
        "/api/profiles",
        json={
            "category_id": category_id,
            "profile_type": "COMPANY",
            "business_name": name,
            "slug": slug,
            "latitude": lat,
            "longitude": lng,
            "is_public": is_public,
            "company_detail": {"legal_name": name},
        },
        headers=_auth(token),
    )


# ---- Helper: Haversine distance for test assertions ----

def haversine(lat1, lng1, lat2, lng2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


# ---- Test: Basic Nearby Search ----


class TestNearbySearch:
    def test_nearby_returns_profiles_in_range(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")

        # Central point: Times Square, NYC
        central_lat, central_lng = 40.7580, -73.9855

        # Create profiles at known distances
        _create_profile(client, token, test_category.id, "Close Cafe", "close-cafe", 40.7585, -73.9850, True)
        _create_profile(client, token, test_category.id, "Far Restaurant", "far-restaurant", 40.8000, -73.9500, True)

        resp = client.get(
            "/api/profiles/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 5},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert data["page"] == 1
        assert data["page_size"] == 20
        assert data["total_pages"] == 1
        assert len(data["results"]) == 2

        # Closest should be first
        assert data["results"][0]["business_name"] == "Close Cafe"
        assert data["results"][0]["distance_km"] < 1.0

        # Farther should be second
        assert data["results"][1]["business_name"] == "Far Restaurant"
        assert data["results"][1]["distance_km"] > 1.0

    def test_nearby_excludes_out_of_range(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        _create_profile(client, token, test_category.id, "Nearby", "nearby-p", 40.7590, -73.9860, True)
        _create_profile(client, token, test_category.id, "Very Far", "very-far", 51.5074, -0.1278, True)  # London

        resp = client.get(
            "/api/profiles/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 5},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["results"][0]["business_name"] == "Nearby"

    def test_nearby_excludes_private_profiles(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        _create_profile(client, token, test_category.id, "Public", "public-p", 40.7590, -73.9860, True)
        _create_profile(client, token, test_category.id, "Private", "private-p", 40.7591, -73.9861, False)

        resp = client.get(
            "/api/profiles/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 5},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["results"][0]["business_name"] == "Public"


# ---- Test: Sorting ----


class TestNearbySorting:
    def test_results_sorted_by_distance_ascending(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        # Create at various distances
        _create_profile(client, token, test_category.id, "Medium", "medium-d", 40.7600, -73.9830, True)
        _create_profile(client, token, test_category.id, "Far", "far-d", 40.7800, -73.9600, True)
        _create_profile(client, token, test_category.id, "Close", "close-d", 40.7582, -73.9853, True)

        resp = client.get(
            "/api/profiles/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 10},
        )
        assert resp.status_code == 200
        results = resp.json()["results"]
        assert len(results) == 3

        names = [r["business_name"] for r in results]
        assert names == ["Close", "Medium", "Far"]

        distances = [r["distance_km"] for r in results]
        assert distances == sorted(distances)


# ---- Test: Pagination ----


class TestNearbyPagination:
    def test_pagination_returns_correct_page(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        # Create 5 profiles at slightly different distances
        for i in range(5):
            _create_profile(
                client, token, test_category.id,
                f"Biz {i}", f"biz-page-{i}",
                40.7580 + (i * 0.001), -73.9855,
                True,
            )

        resp = client.get(
            "/api/profiles/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 5, "page": 1, "page_size": 2},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 5
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert data["total_pages"] == 3
        assert len(data["results"]) == 2

    def test_pagination_page_2(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        for i in range(5):
            _create_profile(
                client, token, test_category.id,
                f"Biz {i}", f"biz-page2-{i}",
                40.7580 + (i * 0.001), -73.9855,
                True,
            )

        resp = client.get(
            "/api/profiles/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 5, "page": 2, "page_size": 2},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["results"]) == 2
        assert data["page"] == 2

    def test_empty_page_returns_empty_results(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        _create_profile(client, token, test_category.id, "Only One", "only-one", 40.7590, -73.9860, True)

        resp = client.get(
            "/api/profiles/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 5, "page": 5, "page_size": 2},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert len(data["results"]) == 0


# ---- Test: Validation ----


class TestNearbyValidation:
    def test_invalid_latitude_too_high(self, client):
        resp = client.get("/api/profiles/nearby", params={"latitude": 91, "longitude": 0})
        assert resp.status_code == 422

    def test_invalid_latitude_too_low(self, client):
        resp = client.get("/api/profiles/nearby", params={"latitude": -91, "longitude": 0})
        assert resp.status_code == 422

    def test_invalid_longitude_too_high(self, client):
        resp = client.get("/api/profiles/nearby", params={"latitude": 0, "longitude": 181})
        assert resp.status_code == 422

    def test_invalid_longitude_too_low(self, client):
        resp = client.get("/api/profiles/nearby", params={"latitude": 0, "longitude": -181})
        assert resp.status_code == 422

    def test_radius_zero_rejected(self, client):
        resp = client.get("/api/profiles/nearby", params={"latitude": 0, "longitude": 0, "radius_km": 0})
        assert resp.status_code == 422

    def test_radius_over_100_rejected(self, client):
        resp = client.get("/api/profiles/nearby", params={"latitude": 0, "longitude": 0, "radius_km": 101})
        assert resp.status_code == 422

    def test_page_size_over_100_rejected(self, client):
        resp = client.get("/api/profiles/nearby", params={"latitude": 0, "longitude": 0, "page_size": 101})
        assert resp.status_code == 422

    def test_page_zero_rejected(self, client):
        resp = client.get("/api/profiles/nearby", params={"latitude": 0, "longitude": 0, "page": 0})
        assert resp.status_code == 422

    def test_missing_latitude_rejected(self, client):
        resp = client.get("/api/profiles/nearby", params={"longitude": 0})
        assert resp.status_code == 422

    def test_missing_longitude_rejected(self, client):
        resp = client.get("/api/profiles/nearby", params={"latitude": 0})
        assert resp.status_code == 422


# ---- Test: No Results ----


class TestNearbyNoResults:
    def test_no_profiles_in_database(self, client):
        resp = client.get("/api/profiles/nearby", params={"latitude": 40.7580, "longitude": -73.9855, "radius_km": 5})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["results"] == []
        assert data["total_pages"] == 0

    def test_no_profiles_with_coordinates(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        _create_profile(client, token, test_category.id, "No Coords", "no-coords", None, None, True)

        resp = client.get("/api/profiles/nearby", params={"latitude": 40.7580, "longitude": -73.9855, "radius_km": 5})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0


# ---- Test: Distance Accuracy ----


class TestDistanceAccuracy:
    def test_distance_calculation_is_reasonable(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        # ~1km away
        _create_profile(client, token, test_category.id, "One KM", "one-km", 40.7670, -73.9855, True)

        resp = client.get(
            "/api/profiles/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 2},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        # Haversine should give ~1km, allow margin for test
        assert 0.5 < data["results"][0]["distance_km"] < 2.0
