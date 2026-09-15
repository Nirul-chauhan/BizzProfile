import enum
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DocumentType(str, enum.Enum):
    BUSINESS_REGISTRATION = "BUSINESS_REGISTRATION"
    GST = "GST"
    MSME = "MSME"
    PAN = "PAN"
    OTHER = "OTHER"


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_profile_id", "profile_id"),
        Index("ix_documents_verification_status", "verification_status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("biz_profiles.id", ondelete="CASCADE"), nullable=False
    )
    document_type: Mapped[str] = mapped_column(String(30), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    verification_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=VerificationStatus.PENDING.value
    )
    uploaded_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    rejection_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    biz_profile: Mapped["BizProfile"] = relationship(
        "BizProfile",
        back_populates="documents",
        passive_deletes=True,
    )
    uploader: Mapped["User | None"] = relationship(
        "User",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, type='{self.document_type}', status='{self.verification_status}')>"
