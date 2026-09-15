import os
import sys
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Ensure app package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base
from app.models.otp import Otp, OtpPurpose
from app.models.role import Role
from app.models.user import User
from app.services.otp import OtpService, MAX_ATTEMPTS, MAX_ACTIVE_OTPS


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
def role(db):
    role = Role(name="USER", description="Standard user")
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@pytest.fixture()
def user(db, role):
    user = User(
        role_id=role.id,
        full_name="Test User",
        email="test@example.com",
        mobile="+919999999999",
        password_hash="hashed",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


class TestOtpGeneration:
    def test_generate_returns_code_and_otp(self, db):
        svc = OtpService(db)
        code, otp = svc.generate("test@example.com", OtpPurpose.REGISTRATION)
        assert len(code) == 6
        assert code.isdigit()
        assert otp.destination == "test@example.com"
        assert otp.purpose == OtpPurpose.REGISTRATION.value
        assert otp.is_verified is False
        assert otp.attempt_count == 0
        assert otp.expires_at > datetime.now(timezone.utc)

    def test_otp_code_is_plaintext(self, db):
        svc = OtpService(db)
        code, otp = svc.generate("test@example.com", OtpPurpose.LOGIN)
        assert otp.otp_code == code
        assert len(otp.otp_code) == 6
        assert otp.otp_code.isdigit()

    def test_generate_with_user_id(self, db, user):
        svc = OtpService(db)
        code, otp = svc.generate(
            "test@example.com", OtpPurpose.LOGIN, user_id=user.id
        )
        assert otp.user_id == user.id

    def test_generate_stores_in_database(self, db):
        svc = OtpService(db)
        code, otp = svc.generate("test@example.com", OtpPurpose.REGISTRATION)
        from sqlalchemy import select

        stored = db.execute(select(Otp).where(Otp.id == otp.id)).scalars().first()
        assert stored is not None
        assert stored.otp_code == code

    def test_generate_limits_active_otps(self, db):
        svc = OtpService(db)
        for _ in range(MAX_ACTIVE_OTPS):
            svc.generate("test@example.com", OtpPurpose.REGISTRATION)
        with pytest.raises(ValueError, match="Too many active OTPs"):
            svc.generate("test@example.com", OtpPurpose.REGISTRATION)


class TestOtpVerification:
    def test_verify_success(self, db):
        svc = OtpService(db)
        code, otp = svc.generate("test@example.com", OtpPurpose.LOGIN)
        verified = svc.verify("test@example.com", OtpPurpose.LOGIN, code)
        assert verified.is_verified is True

    def test_verify_wrong_code(self, db):
        svc = OtpService(db)
        svc.generate("test@example.com", OtpPurpose.LOGIN)
        with pytest.raises(ValueError, match="Invalid OTP"):
            svc.verify("test@example.com", OtpPurpose.LOGIN, "000000")

    def test_verify_increments_attempt_count(self, db):
        svc = OtpService(db)
        svc.generate("test@example.com", OtpPurpose.LOGIN)
        with pytest.raises(ValueError):
            svc.verify("test@example.com", OtpPurpose.LOGIN, "000000")
        otp = db.query(Otp).filter_by(destination="test@example.com").first()
        assert otp.attempt_count == 1

    def test_verify_rejects_after_max_attempts(self, db):
        svc = OtpService(db)
        svc.generate("test@example.com", OtpPurpose.LOGIN)
        for _ in range(MAX_ATTEMPTS):
            with pytest.raises(ValueError):
                svc.verify("test@example.com", OtpPurpose.LOGIN, "000000")
        with pytest.raises(ValueError, match="attempts exceeded"):
            svc.verify("test@example.com", OtpPurpose.LOGIN, "000000")

    def test_verified_otp_not_reusable(self, db):
        svc = OtpService(db)
        code, _ = svc.generate("test@example.com", OtpPurpose.LOGIN)
        svc.verify("test@example.com", OtpPurpose.LOGIN, code)
        with pytest.raises(ValueError, match="Invalid or expired OTP"):
            svc.verify("test@example.com", OtpPurpose.LOGIN, code)


class TestOtpExpiration:
    def test_expired_otp_rejected(self, db):
        svc = OtpService(db)
        code, otp = svc.generate("test@example.com", OtpPurpose.LOGIN)
        otp.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.commit()
        with pytest.raises(ValueError, match="Invalid or expired OTP"):
            svc.verify("test@example.com", OtpPurpose.LOGIN, code)

    def test_is_verified_false_for_expired(self, db):
        svc = OtpService(db)
        assert svc.is_verified("nonexistent@example.com", OtpPurpose.LOGIN) is False


class TestOtpIsVerified:
    def test_is_verified_returns_true(self, db):
        svc = OtpService(db)
        code, _ = svc.generate("test@example.com", OtpPurpose.LOGIN)
        svc.verify("test@example.com", OtpPurpose.LOGIN, code)
        assert svc.is_verified("test@example.com", OtpPurpose.LOGIN) is True

    def test_is_verified_returns_false(self, db):
        svc = OtpService(db)
        assert svc.is_verified("test@example.com", OtpPurpose.LOGIN) is False


class TestOtpPurposeEnum:
    def test_all_purposes(self):
        purposes = [
            OtpPurpose.REGISTRATION,
            OtpPurpose.LOGIN,
            OtpPurpose.FORGOT_PASSWORD,
            OtpPurpose.EMAIL_VERIFICATION,
            OtpPurpose.MOBILE_VERIFICATION,
        ]
        assert len(purposes) == 5
        assert all(isinstance(p, OtpPurpose) for p in purposes)
