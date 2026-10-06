import math
import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base, get_db
from app.dependencies.database import get_db_session
from app.main import app
from app.models.biz_profile import BizProfile
from app.models.category import Category
from app.models.role import Role, RoleEnum
from app.models.service import BizService, ServiceApprovalStatus, ServiceStatus
from app.models.service_listing import (
    ListingApprovalStatus,
    ServiceCategory,
    ServiceListing,
)
from app.models.user import User
from app.services.password import hash_password


@pytest.fixture(scope="module")
def engine():
    # TestClient runs the app on a worker thread, so the in-memory SQLite
    # connection must be usable from more than the thread that created it.
    eng = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
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
    # Routers declare `Depends(get_db_session)`, and that wrapper calls get_db()
    # as a plain Python call, so overriding get_db alone leaves them talking to
    # the real database. Override the dependency the routers actually declare.
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
def test_user(db, user_role):
    user = User(
        role_id=user_role.id,
        full_name="Test User",
        email="test@example.com",
        password_hash=hash_password("TestPass123!"),
        is_active=True,
        is_email_verified=True,
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


def _create_profile(db, client, token, category_id, name, slug, lat, lng, is_public=True):
    resp = client.post(
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
    # /api/profiles/nearby only lists verified businesses. The API will not let
    # a seller self-verify, so mark it here to exercise the distance logic
    # these tests are actually about. TestVerificationFiltering covers the
    # verification requirement itself.
    db.query(BizProfile).filter(BizProfile.slug == slug).update(
        {"is_verified": True}
    )
    db.commit()
    return resp


# ---- Helper: Haversine distance for test assertions ----

def haversine(lat1, lng1, lat2, lng2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


# ---- Test: Basic Nearby Search ----


class TestNearbySearch:
    def test_nearby_returns_profiles_in_range(self, client, test_user, test_category, db):
        token = _login(client, "test@example.com", "TestPass123!")

        # Central point: Times Square, NYC
        central_lat, central_lng = 40.7580, -73.9855

        # Create profiles at known distances
        _create_profile(db, client, token, test_category.id, "Close Cafe", "close-cafe", 40.7585, -73.9850, True)
        # ~3.0 km north. The original 40.8000/-73.9500 is ~5.5 km away, i.e.
        # outside the 5 km radius this test searches, so it never belonged here.
        _create_profile(db, client, token, test_category.id, "Far Restaurant", "far-restaurant", 40.7850, -73.9855, True)

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

    def test_nearby_excludes_out_of_range(self, client, test_user, test_category, db):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        _create_profile(db, client, token, test_category.id, "Nearby", "nearby-p", 40.7590, -73.9860, True)
        _create_profile(db, client, token, test_category.id, "Very Far", "very-far", 51.5074, -0.1278, True)  # London

        resp = client.get(
            "/api/profiles/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 5},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["results"][0]["business_name"] == "Nearby"

    def test_nearby_excludes_private_profiles(self, client, test_user, test_category, db):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        _create_profile(db, client, token, test_category.id, "Public", "public-p", 40.7590, -73.9860, True)
        _create_profile(db, client, token, test_category.id, "Private", "private-p", 40.7591, -73.9861, False)

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
    def test_results_sorted_by_distance_ascending(self, client, test_user, test_category, db):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        # Create at various distances
        _create_profile(db, client, token, test_category.id, "Medium", "medium-d", 40.7600, -73.9830, True)
        _create_profile(db, client, token, test_category.id, "Far", "far-d", 40.7800, -73.9600, True)
        _create_profile(db, client, token, test_category.id, "Close", "close-d", 40.7582, -73.9853, True)

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
    def test_pagination_returns_correct_page(self, client, test_user, test_category, db):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        # Create 5 profiles at slightly different distances
        for i in range(5):
            _create_profile(
                db, client, token, test_category.id,
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

    def test_pagination_page_2(self, client, test_user, test_category, db):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        for i in range(5):
            _create_profile(
                db, client, token, test_category.id,
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

    def test_empty_page_returns_empty_results(self, client, test_user, test_category, db):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        _create_profile(db, client, token, test_category.id, "Only One", "only-one", 40.7590, -73.9860, True)

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

    def test_no_profiles_with_coordinates(self, client, test_user, test_category, db):
        token = _login(client, "test@example.com", "TestPass123!")
        _create_profile(db, client, token, test_category.id, "No Coords", "no-coords", None, None, True)

        resp = client.get("/api/profiles/nearby", params={"latitude": 40.7580, "longitude": -73.9855, "radius_km": 5})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0


# ---- Test: Distance Accuracy ----


class TestDistanceAccuracy:
    def test_distance_calculation_is_reasonable(self, client, test_user, test_category, db):
        token = _login(client, "test@example.com", "TestPass123!")

        central_lat, central_lng = 40.7580, -73.9855

        # ~1km away
        _create_profile(db, client, token, test_category.id, "One KM", "one-km", 40.7670, -73.9855, True)

        resp = client.get(
            "/api/profiles/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 2},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        # Haversine should give ~1km, allow margin for test
        assert 0.5 < data["results"][0]["distance_km"] < 2.0


# ---- Test: Verification Filtering ----


class TestVerificationFiltering:
    def test_unverified_profiles_are_hidden(self, client, test_user, test_category, db):
        """Verification is a hard filter, and it is set outside the create API."""
        token = _login(client, "test@example.com", "TestPass123!")
        _create_profile(db, client, token, test_category.id, "Pending", "pending-p", 40.7590, -73.9860, True)
        db.query(BizProfile).filter(BizProfile.slug == "pending-p").update(
            {"is_verified": False}
        )
        db.commit()

        resp = client.get(
            "/api/profiles/nearby",
            params={"latitude": 40.7580, "longitude": -73.9855, "radius_km": 5},
        )
        assert resp.status_code == 200
        assert resp.json()["total"] == 0


# ---- Test: Combined /api/nearby endpoint ----


class TestNearbyAllEndpoint:
    """The endpoint the 1/3/5/10 KM chips on the Nearby Me page actually call."""

    def _create_business(self, db, client, token, category_id, name, slug, lat, lng):
        _create_profile(db, client, token, category_id, name, slug, lat, lng, True)

    def _add_service(self, db, profile_id, category_id, name, slug, lat=None, lng=None):
        svc = BizService(
            profile_id=profile_id,
            category_id=category_id,
            name=name,
            slug=slug,
            description=f"{name} description",
            status=ServiceStatus.ACTIVE.value,
            approval_status=ServiceApprovalStatus.APPROVED.value,
            is_available=True,
            is_published=True,
            latitude=lat,
            longitude=lng,
        )
        db.add(svc)
        db.commit()
        return svc

    def _add_listing(self, db, profile_id, added_by_user_id, name, slug, lat=None, lng=None, active=True):
        cat = db.query(ServiceCategory).first()
        if cat is None:
            cat = ServiceCategory(name="Home Services", slug="home-services")
            db.add(cat)
            db.commit()
            db.refresh(cat)
        listing = ServiceListing(
            name=name,
            slug=slug,
            description=f"{name} description",
            category_id=cat.id,
            provider_name="Test Provider",
            price=100.0,
            profile_id=profile_id,
            added_by_user_id=added_by_user_id,
            approval_status=ListingApprovalStatus.APPROVED.value,
            is_active=active,
            latitude=lat,
            longitude=lng,
        )
        db.add(listing)
        db.commit()
        return listing

    def test_businesses_products_and_services_grouped(
        self, client, test_user, test_category, db
    ):
        token = _login(client, "test@example.com", "TestPass123!")
        central_lat, central_lng = 40.7580, -73.9855

        self._create_business(
            db, client, token, test_category.id, "Close Cafe", "all-close", 40.7590, -73.9860
        )
        profile = db.query(BizProfile).filter(BizProfile.slug == "all-close").one()
        self._add_service(db, profile.id, test_category.id, "Cafe Espresso Bar", "all-svc-espresso")

        resp = client.get(
            "/api/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 5},
        )
        assert resp.status_code == 200
        data = resp.json()

        assert data["center"] == {"latitude": central_lat, "longitude": central_lng}
        assert data["radius_km"] == 5
        assert [b["business_name"] for b in data["businesses"]["items"]] == ["Close Cafe"]
        assert [s["name"] for s in data["services"]["items"]] == ["Cafe Espresso Bar"]
        assert data["products"]["items"] == []

    def test_service_inherits_business_location_when_it_has_none(
        self, client, test_user, test_category, db
    ):
        """A service with no coordinates of its own sits at its business's."""
        token = _login(client, "test@example.com", "TestPass123!")
        central_lat, central_lng = 40.7580, -73.9855

        self._create_business(
            db, client, token, test_category.id, "Corner Shop", "inherit-biz", 40.7590, -73.9860
        )
        profile = db.query(BizProfile).filter(BizProfile.slug == "inherit-biz").one()
        svc = self._add_service(db, profile.id, test_category.id, "No Coords Service", "inherit-svc")
        assert svc.latitude is None and svc.longitude is None

        resp = client.get(
            "/api/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 5},
        )
        assert resp.status_code == 200
        items = resp.json()["services"]["items"]
        assert len(items) == 1
        # Reports the position the distance was actually measured from.
        assert items[0]["latitude"] == pytest.approx(40.7590)
        assert items[0]["longitude"] == pytest.approx(-73.9860)
        assert items[0]["source"] == "biz_service"

    def test_service_prefers_its_own_location_over_the_business(
        self, client, test_user, test_category, db
    ):
        token = _login(client, "test@example.com", "TestPass123!")
        central_lat, central_lng = 40.7580, -73.9855

        # ~6.7 km north, deliberately outside the 5 km radius.
        self._create_business(
            db, client, token, test_category.id, "Far Business", "own-biz", 40.8180, -73.9855
        )
        profile = db.query(BizProfile).filter(BizProfile.slug == "own-biz").one()
        # Service has its own coordinates, near the buyer, so it must be found
        # even though its business is far away.
        self._add_service(db, profile.id, test_category.id, "Mobile Service", "own-svc", 40.7590, -73.9860)

        resp = client.get(
            "/api/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 5},
        )
        assert resp.status_code == 200
        data = resp.json()
        # The business itself is out of range, the service it owns is not.
        assert data["businesses"]["items"] == []
        assert [s["name"] for s in data["services"]["items"]] == ["Mobile Service"]
        assert data["services"]["items"][0]["latitude"] == pytest.approx(40.7590)

    def test_listing_inherits_business_location_when_it_has_none(
        self, client, test_user, test_category, db
    ):
        """A directory listing with no coordinates of its own uses its business's.

        This is the case that previously never matched: the query required
        ServiceListing.latitude to be set, so listings were never returned.
        """
        token = _login(client, "test@example.com", "TestPass123!")
        central_lat, central_lng = 40.7580, -73.9855

        self._create_business(
            db, client, token, test_category.id, "Listing Biz", "listing-biz", 40.7590, -73.9860
        )
        profile = db.query(BizProfile).filter(BizProfile.slug == "listing-biz").one()
        self._add_listing(db, profile.id, test_user.id, "Plumbing Emergency", "listing-inherit")

        resp = client.get(
            "/api/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 5},
        )
        assert resp.status_code == 200
        items = resp.json()["services"]["items"]
        assert [(i["name"], i["source"]) for i in items] == [
            ("Plumbing Emergency", "service_listing")
        ]
        assert items[0]["latitude"] == pytest.approx(40.7590)
        assert items[0]["longitude"] == pytest.approx(-73.9860)

    def test_rows_without_any_location_are_hidden(
        self, client, test_user, test_category, db
    ):
        """A business with no coordinates must not surface, even at a large radius."""
        token = _login(client, "test@example.com", "TestPass123!")

        # No coordinates at all.
        _create_profile(
            db, client, token, test_category.id, "Nowhere", "nowhere-biz", None, None, True
        )
        # Half a coordinate pair is not a position either.
        _create_profile(
            db, client, token, test_category.id, "Half", "half-biz", 40.7590, None, True
        )

        resp = client.get(
            "/api/nearby",
            params={"latitude": 40.7580, "longitude": -73.9855, "radius_km": 100},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["businesses"]["items"] == []
        assert data["products"]["items"] == []
        assert data["services"]["items"] == []

    def test_radius_narrows_results(self, client, test_user, test_category, db):
        """The four radii the UI offers must each return a different count."""
        token = _login(client, "test@example.com", "TestPass123!")
        central_lat, central_lng = 40.7580, -73.9855

        # ~0.07 km, ~1.1 km and ~5.5 km away.
        self._create_business(db, client, token, test_category.id, "Very Close", "rad-1", 40.7585, -73.9850)
        self._create_business(db, client, token, test_category.id, "Mid", "rad-2", 40.7670, -73.9855)
        self._create_business(db, client, token, test_category.id, "Far", "rad-3", 40.8000, -73.9500)

        counts = {}
        for km in (1, 3, 5, 10):
            resp = client.get(
                "/api/nearby",
                params={"latitude": central_lat, "longitude": central_lng, "radius_km": km},
            )
            assert resp.status_code == 200
            names = [b["business_name"] for b in resp.json()["businesses"]["items"]]
            counts[km] = names
            # Nothing beyond the requested radius may leak in.
            for b in resp.json()["businesses"]["items"]:
                assert b["distance_km"] <= km

        assert counts[1] == ["Very Close"]
        assert counts[3] == ["Very Close", "Mid"]
        assert counts[5] == ["Very Close", "Mid"]
        assert counts[10] == ["Very Close", "Mid", "Far"]

    def test_results_ordered_by_distance_ascending(
        self, client, test_user, test_category, db
    ):
        token = _login(client, "test@example.com", "TestPass123!")
        central_lat, central_lng = 40.7580, -73.9855

        self._create_business(db, client, token, test_category.id, "C", "ord-c", 40.7800, -73.9855)
        self._create_business(db, client, token, test_category.id, "A", "ord-a", 40.7585, -73.9850)
        self._create_business(db, client, token, test_category.id, "B", "ord-b", 40.7670, -73.9855)

        resp = client.get(
            "/api/nearby",
            params={"latitude": central_lat, "longitude": central_lng, "radius_km": 10},
        )
        assert resp.status_code == 200
        items = resp.json()["businesses"]["items"]
        assert [b["business_name"] for b in items] == ["A", "B", "C"]
        distances = [b["distance_km"] for b in items]
        assert distances == sorted(distances)
