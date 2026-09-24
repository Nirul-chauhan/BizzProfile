import enum
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FavoriteTargetType(str, enum.Enum):
    PRODUCT = "PRODUCT"
    SERVICE = "SERVICE"
    BIZ_PROFILE = "BIZ_PROFILE"


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "target_type",
            "target_id",
            name="uq_favorite_user_target",
        ),
        Index("ix_favorites_user_id", "user_id"),
        Index("ix_favorites_target", "target_type", "target_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    target_type: Mapped[str] = mapped_column(String(20), nullable=False)
    target_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user: Mapped["User"] = relationship("User", passive_deletes=True)

    def __repr__(self) -> str:
        return f"<Favorite(id={self.id}, user_id={self.user_id}, target={self.target_type}:{self.target_id})>"
