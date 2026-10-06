import enum
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EnquiryStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUOTED = "QUOTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CLOSED = "CLOSED"


class Enquiry(Base):
    __tablename__ = "enquiries"
    __table_args__ = (
        Index("ix_enquiries_buyer_id", "buyer_id"),
        Index("ix_enquiries_seller_id", "seller_id"),
        Index("ix_enquiries_profile_id", "profile_id"),
        Index("ix_enquiries_product_id", "product_id"),
        Index("ix_enquiries_service_id", "service_id"),
        Index("ix_enquiries_requirement_id", "requirement_id"),
        Index("ix_enquiries_status", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    buyer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    seller_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("biz_profiles.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    service_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("biz_services.id", ondelete="SET NULL"), nullable=True
    )
    requirement_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("requirements.id", ondelete="SET NULL"), nullable=True
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )
    requirement: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=EnquiryStatus.NEW.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    buyer: Mapped["User"] = relationship(
        "User", foreign_keys=[buyer_id], passive_deletes=True
    )
    seller: Mapped["User"] = relationship(
        "User", foreign_keys=[seller_id], passive_deletes=True
    )
    biz_profile: Mapped["BizProfile"] = relationship(
        "BizProfile", passive_deletes=True
    )
    product: Mapped["Product | None"] = relationship(
        "Product", passive_deletes=True
    )
    service: Mapped["BizService | None"] = relationship(
        "BizService", passive_deletes=True
    )
    linked_requirement: Mapped["Requirement | None"] = relationship(
        "Requirement", passive_deletes=True
    )
    quotations: Mapped[list["Quotation"]] = relationship(
        "Quotation", back_populates="enquiry", passive_deletes=True
    )

    # -- Derived display fields -------------------------------------------
    # Exposed through the seller/buyer enquiry response schemas so the
    # dashboards can show who asked and about what.

    @property
    def buyer_name(self) -> str | None:
        return self.buyer.full_name if self.buyer else None

    @property
    def seller_name(self) -> str | None:
        return self.seller.full_name if self.seller else None

    @property
    def buyer_email(self) -> str | None:
        return self.buyer.email if self.buyer else None

    @property
    def buyer_city(self) -> str | None:
        return self.buyer.city if self.buyer else None

    @property
    def buyer_location(self) -> str | None:
        """Where the buyer lives, e.g. 'Noida' or 'Noida, Uttar Pradesh'."""
        if self.buyer is None:
            return None
        parts = [p for p in (self.buyer.city, self.buyer.state) if p]
        return ", ".join(parts) if parts else None

    @property
    def business_name(self) -> str | None:
        return self.biz_profile.business_name if self.biz_profile else None

    @property
    def product_name(self) -> str | None:
        return self.product.name if self.product else None

    @property
    def service_name(self) -> str | None:
        return self.service.name if self.service else None

    def __repr__(self) -> str:
        return f"<Enquiry(id={self.id}, buyer_id={self.buyer_id}, status='{self.status}')>"
