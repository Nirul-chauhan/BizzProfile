import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class NotificationType(str, enum.Enum):
    ENQUIRY = "ENQUIRY"
    QUOTATION_SENT = "QUOTATION_SENT"
    QUOTATION_ACCEPTED = "QUOTATION_ACCEPTED"
    QUOTATION_REJECTED = "QUOTATION_REJECTED"


class Notification(Base):
    """In-app notification for a user, tied to an enquiry/quotation event."""

    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_id", "user_id"),
        Index("ix_notifications_user_read", "user_id", "is_read"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    enquiry_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("enquiries.id", ondelete="SET NULL"), nullable=True
    )
    quotation_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("quotations.id", ondelete="SET NULL"), nullable=True
    )
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user: Mapped["User"] = relationship("User", passive_deletes=True)

    def __repr__(self) -> str:
        return (
            f"<Notification(id={self.id}, user_id={self.user_id}, "
            f"type='{self.type}', read={self.is_read})>"
        )