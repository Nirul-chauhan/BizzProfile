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


class SocialLinkPlatform(str, enum.Enum):
    INSTAGRAM = "INSTAGRAM"
    FACEBOOK = "FACEBOOK"
    LINKEDIN = "LINKEDIN"
    YOUTUBE = "YOUTUBE"
    X = "X"
    WEBSITE = "WEBSITE"


class SocialLink(Base):
    __tablename__ = "social_links"
    __table_args__ = (
        UniqueConstraint("biz_profile_id", "platform", name="uq_social_link_profile_platform"),
        Index("ix_social_links_biz_profile_id", "biz_profile_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    biz_profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("biz_profiles.id", ondelete="CASCADE"), nullable=False
    )
    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
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
        back_populates="social_links",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<SocialLink(id={self.id}, platform='{self.platform}')>"
