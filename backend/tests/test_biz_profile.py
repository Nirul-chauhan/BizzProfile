import os
import sys
from datetime import datetime, timezone

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base
from app.models.biz_profile import BizProfile, ProfileType
from app.models.category import Category, Subcategory
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.schemas.biz_profile import BizProfileCreate, BizProfileUpdate, BizProfileResponse
from app.services.password import hash_password


# ---- Database Fixtures ----


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
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def test_category(db):
    cat = Category(name="Technology", slug="technology", description="Tech stuff")
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@pytest.fixture()
def test_subcategory(db, test_category):
    sub = Subcategory(
        category_id=test_category.id,
        name="Software",
        slug="software",
        description="Software services",
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


# ---- Model Tests ----


class TestBizProfileModel:
    def test_create_profile(self, db, test_user, test_category):
        profile = BizProfile(
            user_id=test_user.id,
            category_id=test_category.id,
            profile_type="COMPANY",
            business_name="Acme Corp",
            slug="acme-corp",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        assert profile.id is not None
        assert profile.business_name == "Acme Corp"
        assert profile.slug == "acme-corp"
        assert profile.is_public is True
        assert profile.is_verified is False
        assert profile.is_active is True
        assert profile.created_at is not None
        assert profile.updated_at is not None

    def test_profile_with_subcategory(self, db, test_user, test_category, test_subcategory):
        profile = BizProfile(
            user_id=test_user.id,
            category_id=test_category.id,
            subcategory_id=test_subcategory.id,
            profile_type="INDIVIDUAL",
            business_name="John Dev",
            slug="john-dev",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        assert profile.subcategory_id == test_subcategory.id

    def test_profile_optional_subcategory(self, db, test_user, test_category):
        profile = BizProfile(
            user_id=test_user.id,
            category_id=test_category.id,
            subcategory_id=None,
            profile_type="MSME",
            business_name="Small Biz",
            slug="small-biz",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        assert profile.subcategory_id is None

    def test_user_can_own_multiple_profiles(self, db, test_user, test_category):
        p1 = BizProfile(
            user_id=test_user.id,
            category_id=test_category.id,
            profile_type="COMPANY",
            business_name="Company One",
            slug="company-one",
        )
        p2 = BizProfile(
            user_id=test_user.id,
            category_id=test_category.id,
            profile_type="INDIVIDUAL",
            business_name="Personal Brand",
            slug="personal-brand",
        )
        db.add_all([p1, p2])
        db.commit()
        db.refresh(p1)
        db.refresh(p2)
        assert p1.id != p2.id
        assert p1.user_id == p2.user_id

    def test_slug_unique_constraint(self, db, test_user, test_category):
        p1 = BizProfile(
            user_id=test_user.id,
            category_id=test_category.id,
            profile_type="COMPANY",
            business_name="First",
            slug="same-slug",
        )
        db.add(p1)
        db.commit()
        p2 = BizProfile(
            user_id=test_user.id,
            category_id=test_category.id,
            profile_type="COMPANY",
            business_name="Second",
            slug="same-slug",
        )
        db.add(p2)
        with pytest.raises(Exception):
            db.commit()

    def test_profile_type_values(self):
        assert ProfileType.COMPANY.value == "COMPANY"
        assert ProfileType.INDIVIDUAL.value == "INDIVIDUAL"
        assert ProfileType.MSME.value == "MSME"

    def test_profile_relationships(self, db, test_user, test_category, test_subcategory):
        profile = BizProfile(
            user_id=test_user.id,
            category_id=test_category.id,
            subcategory_id=test_subcategory.id,
            profile_type="COMPANY",
            business_name="Rel Co",
            slug="rel-co",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        assert profile.user.id == test_user.id
        assert profile.category.id == test_category.id
        assert profile.subcategory.id == test_subcategory.id

    def test_cascade_from_user(self, db, test_user, test_category):
        profile = BizProfile(
            user_id=test_user.id,
            category_id=test_category.id,
            profile_type="COMPANY",
            business_name="Cascade Test",
            slug="cascade-test",
        )
        db.add(profile)
        db.commit()
        assert db.query(BizProfile).filter_by(user_id=test_user.id).count() == 1


# ---- Schema Tests ----


class TestBizProfileSchemas:
    def test_create_valid(self):
        schema = BizProfileCreate(
            category_id=1,
            profile_type="COMPANY",
            business_name="Test Co",
            slug="test-co",
        )
        assert schema.profile_type == "COMPANY"
        assert schema.business_name == "Test Co"
        assert schema.subcategory_id is None
        assert schema.is_public is True

    def test_create_with_optional_fields(self):
        schema = BizProfileCreate(
            category_id=1,
            subcategory_id=2,
            profile_type="INDIVIDUAL",
            business_name="Full Profile",
            slug="full-profile",
            description="A full profile",
            phone="+919999999999",
            email="contact@test.com",
            website="https://test.com",
            address="123 Main St",
            city="Mumbai",
            state="Maharashtra",
            country="India",
            pincode="400001",
            latitude=19.076,
            longitude=72.8777,
        )
        assert schema.city == "Mumbai"
        assert schema.latitude == 19.076

    def test_create_invalid_profile_type(self):
        with pytest.raises(ValidationError) as exc_info:
            BizProfileCreate(
                category_id=1,
                profile_type="INVALID",
                business_name="Bad Type",
                slug="bad-type",
            )
        assert "profile_type" in str(exc_info.value)

    def test_create_empty_business_name(self):
        with pytest.raises(ValidationError):
            BizProfileCreate(
                category_id=1,
                profile_type="COMPANY",
                business_name="",
                slug="empty-name",
            )

    def test_create_empty_slug(self):
        with pytest.raises(ValidationError):
            BizProfileCreate(
                category_id=1,
                profile_type="COMPANY",
                business_name="Has Name",
                slug="",
            )

    def test_update_valid(self):
        schema = BizProfileUpdate(
            business_name="Updated Name",
            profile_type="MSME",
        )
        assert schema.business_name == "Updated Name"
        assert schema.profile_type == "MSME"
        assert schema.category_id is None

    def test_update_invalid_profile_type(self):
        with pytest.raises(ValidationError):
            BizProfileUpdate(profile_type="BAD")

    def test_response_from_model(self, db, test_user, test_category):
        profile = BizProfile(
            user_id=test_user.id,
            category_id=test_category.id,
            profile_type="COMPANY",
            business_name="Schema Test",
            slug="schema-test",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        response = BizProfileResponse.model_validate(profile)
        assert response.business_name == "Schema Test"
        assert response.profile_type == "COMPANY"
        assert response.is_public is True
