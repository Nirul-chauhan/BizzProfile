import secrets
import string
from datetime import datetime, timedelta, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.otp import Otp, OtpPurpose

MAX_OTP_LENGTH = 6
MAX_ATTEMPTS = 5
MAX_ACTIVE_OTPS = 3


def _generate_otp_code(length: int = MAX_OTP_LENGTH) -> str:
    digits = string.digits
    return "".join(secrets.choice(digits) for _ in range(length))


class OtpService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()

    def generate(
        self,
        email: str | None = None,
        mobile: str | None = None,
        purpose: OtpPurpose = OtpPurpose.REGISTRATION,
        user_id: int | None = None,
    ) -> tuple[str, Otp]:
        # Build query to find existing active OTPs
        conditions = [
            Otp.purpose == purpose.value,
            Otp.is_verified == False,  # noqa: E712
            Otp.expires_at > datetime.now(timezone.utc),
        ]
        if email:
            conditions.append(Otp.email == email)
        if mobile:
            conditions.append(Otp.mobile == mobile)

        existing = self.db.execute(
            select(Otp).where(*conditions)
        ).scalars().all()

        if len(existing) >= MAX_ACTIVE_OTPS:
            raise ValueError(
                f"Too many active OTPs. Max {MAX_ACTIVE_OTPS} allowed."
            )

        code = _generate_otp_code()
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=self.settings.OTP_EXPIRE_MINUTES
        )

        otp = Otp(
            user_id=user_id,
            email=email,
            mobile=mobile,
            otp_code=code,
            purpose=purpose.value,
            expires_at=expires_at,
            attempt_count=0,
            is_verified=False,
        )
        self.db.add(otp)
        self.db.flush()

        # Delete older unverified OTPs for same email/mobile+purpose
        for old in existing:
            self.db.delete(old)

        self.db.commit()
        self.db.refresh(otp)

        return code, otp

    def verify(
        self,
        email: str | None = None,
        mobile: str | None = None,
        purpose: OtpPurpose = OtpPurpose.REGISTRATION,
        code: str = "",
    ) -> Otp:
        conditions = [
            Otp.purpose == purpose.value,
            Otp.is_verified == False,  # noqa: E712
            Otp.expires_at > datetime.now(timezone.utc),
        ]
        identifier_matches = []
        if email:
            identifier_matches.append(Otp.email == email)
        if mobile:
            identifier_matches.append(Otp.mobile == mobile)
        if not identifier_matches:
            raise ValueError("No verification identifier provided.")
        conditions.append(or_(*identifier_matches))

        otp = self.db.execute(
            select(Otp).where(*conditions)
        ).scalars().first()

        if otp is None:
            raise ValueError("Invalid or expired OTP.")

        if otp.attempt_count >= MAX_ATTEMPTS:
            raise ValueError("OTP verification attempts exceeded.")

        if otp.otp_code != code:
            otp.attempt_count += 1
            self.db.commit()
            raise ValueError("Invalid OTP.")

        otp.is_verified = True
        self.db.commit()
        self.db.refresh(otp)

        return otp

    def is_verified(self, email: str | None = None, mobile: str | None = None, purpose: OtpPurpose = OtpPurpose.REGISTRATION) -> bool:
        conditions = [
            Otp.purpose == purpose.value,
            Otp.is_verified == True,  # noqa: E712
        ]
        if email:
            conditions.append(Otp.email == email)
        if mobile:
            conditions.append(Otp.mobile == mobile)

        otp = self.db.execute(
            select(Otp).where(*conditions)
        ).scalars().first()

        return otp is not None
