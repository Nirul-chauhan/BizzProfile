import enum
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Integer, String, Text, Boolean, DateTime, ForeignKey, Float, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ListingApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ServiceCategory(Base):
    __tablename__ = "service_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    subcategories: Mapped[list["ServiceSubcategory"]] = relationship("ServiceSubcategory", back_populates="category", cascade="all, delete-orphan")
    services: Mapped[list["ServiceListing"]] = relationship("ServiceListing", back_populates="category")

    def __repr__(self):
        return f"<ServiceCategory {self.name}>"


class ServiceSubcategory(Base):
    __tablename__ = "service_subcategories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("service_categories.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    category: Mapped["ServiceCategory"] = relationship("ServiceCategory", back_populates="subcategories")
    services: Mapped[list["ServiceListing"]] = relationship("ServiceListing", back_populates="subcategory")

    __table_args__ = (
        Index("ix_service_subcat_category", "category_id"),
        Index("ix_service_subcat_slug", "slug", unique=True),
    )

    def __repr__(self):
        return f"<ServiceSubcategory {self.name}>"


class ServiceListing(Base):
    __tablename__ = "service_listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(250), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    full_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("service_categories.id"), nullable=False)
    subcategory_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("service_subcategories.id"), nullable=True)
    provider_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    contact_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    price_unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    service_radius_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    society_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    profile_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("biz_profiles.id"), nullable=True)
    added_by_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    approval_status: Mapped[str] = mapped_column(String(20), default=ListingApprovalStatus.PENDING.value)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    featured_order: Mapped[int] = mapped_column(Integer, default=0)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    category: Mapped["ServiceCategory"] = relationship("ServiceCategory", back_populates="services")
    subcategory: Mapped[Optional["ServiceSubcategory"]] = relationship("ServiceSubcategory", back_populates="services")
    added_by_user: Mapped["User"] = relationship("User")

    __table_args__ = (
        Index("ix_service_listing_category", "category_id"),
        Index("ix_service_listing_subcategory", "subcategory_id"),
        Index("ix_service_listing_user", "added_by_user_id"),
        Index("ix_service_listing_slug", "slug", unique=True),
        Index("ix_service_listing_approval", "approval_status"),
    )

    def __repr__(self):
        return f"<ServiceListing {self.name}>"
