import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base, get_db
from app.main import app
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


# ---- Company Profile Tests ----


class TestCompanyProfile:
    def test_create_company_profile(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "COMPANY",
                "business_name": "Acme Corp",
                "slug": "acme-corp",
                "company_detail": {
                    "company_registration_number": "REG-12345",
                    "legal_name": "Acme Corporation Ltd",
                    "company_type": "LLC",
                },
            },
            headers=_auth(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["profile_type"] == "COMPANY"
        assert data["company_detail"]["company_registration_number"] == "REG-12345"
        assert data["company_detail"]["legal_name"] == "Acme Corporation Ltd"
        assert data["company_detail"]["company_type"] == "LLC"
        assert data["individual_detail"] is None
        assert data["msme_detail"] is None

    def test_company_profile_rejects_individual_detail(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "COMPANY",
                "business_name": "Bad Corp",
                "slug": "bad-corp",
                "company_detail": {"legal_name": "Good"},
                "individual_detail": {"profession": "Bad"},
            },
            headers=_auth(token),
        )
        assert resp.status_code == 400

    def test_company_profile_rejects_msme_detail(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "COMPANY",
                "business_name": "Bad Corp 2",
                "slug": "bad-corp-2",
                "company_detail": {"legal_name": "Good"},
                "msme_detail": {"industry": "Bad"},
            },
            headers=_auth(token),
        )
        assert resp.status_code == 400

    def test_company_requires_company_detail(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "COMPANY",
                "business_name": "No Detail Corp",
                "slug": "no-detail-corp",
            },
            headers=_auth(token),
        )
        assert resp.status_code == 400

    def test_get_company_profile_with_detail(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        create_resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "COMPANY",
                "business_name": "Get Corp",
                "slug": "get-corp",
                "company_detail": {"legal_name": "Get Corp Legal"},
            },
            headers=_auth(token),
        )
        profile_id = create_resp.json()["id"]
        resp = client.get(f"/api/profiles/{profile_id}", headers=_auth(token))
        assert resp.status_code == 200
        assert resp.json()["company_detail"]["legal_name"] == "Get Corp Legal"

    def test_update_company_detail(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        create_resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "COMPANY",
                "business_name": "Update Corp",
                "slug": "update-corp",
                "company_detail": {"legal_name": "Old Name"},
            },
            headers=_auth(token),
        )
        profile_id = create_resp.json()["id"]
        resp = client.put(
            f"/api/profiles/{profile_id}",
            json={"company_detail": {"legal_name": "New Name"}},
            headers=_auth(token),
        )
        assert resp.status_code == 200
        assert resp.json()["company_detail"]["legal_name"] == "New Name"


# ---- Individual Profile Tests ----


class TestIndividualProfile:
    def test_create_individual_profile(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "INDIVIDUAL",
                "business_name": "John Smith",
                "slug": "john-smith",
                "individual_detail": {
                    "professional_name": "John Smith",
                    "profession": "Software Engineer",
                    "experience_years": 10,
                    "services": "Web development, Mobile apps",
                },
            },
            headers=_auth(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["profile_type"] == "INDIVIDUAL"
        assert data["individual_detail"]["professional_name"] == "John Smith"
        assert data["individual_detail"]["profession"] == "Software Engineer"
        assert data["individual_detail"]["experience_years"] == 10
        assert data["individual_detail"]["services"] == "Web development, Mobile apps"
        assert data["company_detail"] is None
        assert data["msme_detail"] is None

    def test_individual_rejects_company_detail(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "INDIVIDUAL",
                "business_name": "Bad Individual",
                "slug": "bad-individual",
                "individual_detail": {"profession": "Good"},
                "company_detail": {"legal_name": "Bad"},
            },
            headers=_auth(token),
        )
        assert resp.status_code == 400

    def test_individual_requires_individual_detail(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "INDIVIDUAL",
                "business_name": "No Detail Individual",
                "slug": "no-detail-individual",
            },
            headers=_auth(token),
        )
        assert resp.status_code == 400

    def test_individual_experience_years_validation(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "INDIVIDUAL",
                "business_name": "Bad Experience",
                "slug": "bad-experience",
                "individual_detail": {"experience_years": 200},
            },
            headers=_auth(token),
        )
        assert resp.status_code == 422

    def test_update_individual_detail(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        create_resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "INDIVIDUAL",
                "business_name": "Update Individual",
                "slug": "update-individual",
                "individual_detail": {"profession": "Old Profession"},
            },
            headers=_auth(token),
        )
        profile_id = create_resp.json()["id"]
        resp = client.put(
            f"/api/profiles/{profile_id}",
            json={"individual_detail": {"profession": "New Profession"}},
            headers=_auth(token),
        )
        assert resp.status_code == 200
        assert resp.json()["individual_detail"]["profession"] == "New Profession"


# ---- MSME Profile Tests ----


class TestMsmProfile:
    def test_create_msme_profile(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "MSME",
                "business_name": "Local Bakery",
                "slug": "local-bakery",
                "msme_detail": {
                    "msme_number": "MSME-999",
                    "business_type": "Food Processing",
                    "industry": "Food & Beverage",
                },
            },
            headers=_auth(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["profile_type"] == "MSME"
        assert data["msme_detail"]["msme_number"] == "MSME-999"
        assert data["msme_detail"]["business_type"] == "Food Processing"
        assert data["msme_detail"]["industry"] == "Food & Beverage"
        assert data["company_detail"] is None
        assert data["individual_detail"] is None

    def test_msme_rejects_company_detail(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "MSME",
                "business_name": "Bad MSME",
                "slug": "bad-msme",
                "msme_detail": {"industry": "Good"},
                "company_detail": {"legal_name": "Bad"},
            },
            headers=_auth(token),
        )
        assert resp.status_code == 400

    def test_msme_requires_msme_detail(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "MSME",
                "business_name": "No Detail MSME",
                "slug": "no-detail-msme",
            },
            headers=_auth(token),
        )
        assert resp.status_code == 400

    def test_update_msme_detail(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        create_resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "MSME",
                "business_name": "Update MSME",
                "slug": "update-msme",
                "msme_detail": {"industry": "Old Industry"},
            },
            headers=_auth(token),
        )
        profile_id = create_resp.json()["id"]
        resp = client.put(
            f"/api/profiles/{profile_id}",
            json={"msme_detail": {"industry": "New Industry"}},
            headers=_auth(token),
        )
        assert resp.status_code == 200
        assert resp.json()["msme_detail"]["industry"] == "New Industry"


# ---- Cascading Delete Tests ----


class TestCascadingDelete:
    def test_deleting_profile_removes_child(self, client, test_user, test_category):
        token = _login(client, "test@example.com", "TestPass123!")
        create_resp = client.post(
            "/api/profiles",
            json={
                "category_id": test_category.id,
                "profile_type": "COMPANY",
                "business_name": "Delete Corp",
                "slug": "delete-corp",
                "company_detail": {"legal_name": "To Be Deleted"},
            },
            headers=_auth(token),
        )
        profile_id = create_resp.json()["id"]
        resp = client.delete(f"/api/profiles/{profile_id}", headers=_auth(token))
        assert resp.status_code == 204

        resp = client.get(f"/api/profiles/{profile_id}", headers=_auth(token))
        assert resp.status_code == 404
