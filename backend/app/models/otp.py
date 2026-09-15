import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OtpPurpose(str, enum.Enum):
    REGISTRATION = "REGISTRATION"
    LOGIN = "LOGIN"
    FORGOT_PASSWORD = "FORGOT_PASSWORD"
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"
    MOBILE_VERIFICATION = "MOBILE_VERIFICATION"


class Otp(Base):
    __tablename__ = "otps"
    __table_args__ = (
        Index("ix_otps_email", "email"),
        Index("ix_otps_mobile", "mobile"),
        Index("ix_otps_purpose", "purpose"),
        Index("ix_otps_user_id", "user_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mobile: Mapped[str | None] = mapped_column(String(20), nullable=True)
    otp_code: Mapped[str] = mapped_column(String(6), nullable=False)
    purpose: Mapped[str] = mapped_column(String(30), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user: Mapped["User | None"] = relationship("User", backref="otps")

    def __repr__(self) -> str:
        return f"<Otp(id={self.id}, email='{self.email}', mobile='{self.mobile}', purpose='{self.purpose}')>"
