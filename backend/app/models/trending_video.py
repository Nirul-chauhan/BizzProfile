import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class VideoPlatform(str, enum.Enum):
    YOUTUBE = "YOUTUBE"
    INSTAGRAM = "INSTAGRAM"
    FACEBOOK = "FACEBOOK"
    UPLOAD = "UPLOAD"


class VideoApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class TrendingVideo(Base):
    __tablename__ = "trending_videos"
    __table_args__ = (
        Index("ix_trending_videos_is_active", "is_active"),
        Index("ix_trending_videos_platform", "platform"),
        Index("ix_trending_videos_approval_status", "approval_status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    video_url: Mapped[str] = mapped_column(String(500), nullable=False)
    embed_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    added_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    profile_id: Mapped[int | None] = mapped_column(ForeignKey("biz_profiles.id"), nullable=True)
    approval_status: Mapped[str] = mapped_column(String(20), default=VideoApprovalStatus.APPROVED.value, nullable=False)
    rejection_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_trending: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    added_by: Mapped["User | None"] = relationship("User")  # noqa: F821
    category: Mapped["Category | None"] = relationship("Category")  # noqa: F821
    profile: Mapped["BizProfile | None"] = relationship("BizProfile")  # noqa: F821

    def __repr__(self) -> str:
        return f"<TrendingVideo(id={self.id}, platform='{self.platform}', title='{self.title}')>"
