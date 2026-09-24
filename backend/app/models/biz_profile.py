import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProfileType(str, enum.Enum):
    COMPANY = "COMPANY"
    INDIVIDUAL = "INDIVIDUAL"
    MSME = "MSME"


class BizProfile(Base):
    __tablename__ = "biz_profiles"
    __table_args__ = (
        UniqueConstraint("slug"),
        Index("ix_biz_profiles_business_name", "business_name"),
        Index("ix_biz_profiles_slug", "slug"),
        Index("ix_biz_profiles_category_id", "category_id"),
        Index("ix_biz_profiles_subcategory_id", "subcategory_id"),
        Index("ix_biz_profiles_city", "city"),
        Index("ix_biz_profiles_state", "state"),
        Index("ix_biz_profiles_profile_type", "profile_type"),
        Index("ix_biz_profiles_latitude", "latitude"),
        Index("ix_biz_profiles_longitude", "longitude"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("categories.id"), nullable=False)
    subcategory_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("subcategories.id"), nullable=True
    )
    profile_type: Mapped[str] = mapped_column(String(20), nullable=False)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(20), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    featured_order: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", backref="biz_profiles")
    category: Mapped["Category"] = relationship("Category", backref="biz_profiles")
    subcategory: Mapped["Subcategory | None"] = relationship("Subcategory", backref="biz_profiles")

    __mapper_args__ = {
        "polymorphic_on": "profile_type",
        "polymorphic_identity": None,
    }

    def __repr__(self) -> str:
        return f"<BizProfile(id={self.id}, business_name='{self.business_name}')>"


class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    biz_profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("biz_profiles.id", ondelete="CASCADE"), primary_key=True
    )
    company_registration_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    legal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    biz_profile: Mapped["BizProfile"] = relationship(
        "BizProfile",
        back_populates="company_detail",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
        single_parent=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": ProfileType.COMPANY,
    }

    def __repr__(self) -> str:
        return f"<CompanyProfile(biz_profile_id={self.biz_profile_id})>"


class IndividualProfile(Base):
    __tablename__ = "individual_profiles"

    biz_profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("biz_profiles.id", ondelete="CASCADE"), primary_key=True
    )
    professional_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    profession: Mapped[str | None] = mapped_column(String(100), nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    services: Mapped[str | None] = mapped_column(Text, nullable=True)

    biz_profile: Mapped["BizProfile"] = relationship(
        "BizProfile",
        back_populates="individual_detail",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
        single_parent=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": ProfileType.INDIVIDUAL,
    }

    def __repr__(self) -> str:
        return f"<IndividualProfile(biz_profile_id={self.biz_profile_id})>"


class MsmProfile(Base):
    __tablename__ = "msme_profiles"

    biz_profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("biz_profiles.id", ondelete="CASCADE"), primary_key=True
    )
    msme_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    business_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)

    biz_profile: Mapped["BizProfile"] = relationship(
        "BizProfile",
        back_populates="msme_detail",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
        single_parent=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": ProfileType.MSME,
    }

    def __repr__(self) -> str:
        return f"<MsmProfile(biz_profile_id={self.biz_profile_id})>"


# Add back_populates relationships to BizProfile (after child classes defined)
BizProfile.company_detail: Mapped["CompanyProfile | None"] = relationship(
    "CompanyProfile",
    back_populates="biz_profile",
    uselist=False,
    cascade="all, delete-orphan",
    passive_deletes=True,
)
BizProfile.individual_detail: Mapped["IndividualProfile | None"] = relationship(
    "IndividualProfile",
    back_populates="biz_profile",
    uselist=False,
    cascade="all, delete-orphan",
    passive_deletes=True,
)
BizProfile.msme_detail: Mapped["MsmProfile | None"] = relationship(
    "MsmProfile",
    back_populates="biz_profile",
    uselist=False,
    cascade="all, delete-orphan",
    passive_deletes=True,
)
BizProfile.social_links: Mapped[list["SocialLink"]] = relationship(
    "SocialLink",
    back_populates="biz_profile",
    cascade="all, delete-orphan",
    passive_deletes=True,
)
BizProfile.documents: Mapped[list["Document"]] = relationship(
    "Document",
    back_populates="biz_profile",
    cascade="all, delete-orphan",
    passive_deletes=True,
)
BizProfile.reviews: Mapped[list["Review"]] = relationship(
    "Review",
    back_populates="biz_profile",
    cascade="all, delete-orphan",
    passive_deletes=True,
)
