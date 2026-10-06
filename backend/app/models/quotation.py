import enum
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class QuotationStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class Quotation(Base):
    __tablename__ = "quotations"
    __table_args__ = (
        Index("ix_quotations_enquiry_id", "enquiry_id"),
        Index("ix_quotations_seller_id", "seller_id"),
        Index("ix_quotations_buyer_id", "buyer_id"),
        Index("ix_quotations_status", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    enquiry_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("enquiries.id", ondelete="CASCADE"), nullable=False
    )
    seller_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    buyer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    # -- Commercial document ------------------------------------------------
    # `amount` stays the authoritative total the buyer accepts. The fields
    # around it explain how that total was reached, so the quotation reads
    # like a real document instead of a single opaque number.
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    # NULL unit_price means the quote is a lump sum (no per-unit breakdown).
    unit_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    # None means "not promised" rather than "same day".
    delivery_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # valid_until is the authoritative expiry; valid_days records how long the
    # seller offered so the UI can show "Valid for 7 days".
    valid_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    terms: Mapped[str | None] = mapped_column(Text, nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=QuotationStatus.PENDING.value
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

    enquiry: Mapped["Enquiry"] = relationship(
        "Enquiry", back_populates="quotations", passive_deletes=True
    )
    seller: Mapped["User"] = relationship(
        "User", foreign_keys=[seller_id], passive_deletes=True
    )
    buyer: Mapped["User"] = relationship(
        "User", foreign_keys=[buyer_id], passive_deletes=True
    )

    # -- Derived display fields -------------------------------------------
    # Lets the buyer see which business quoted, and the seller see who they
    # quoted for, without extra queries in the routers.

    @property
    def buyer_name(self) -> str | None:
        return self.buyer.full_name if self.buyer else None

    @property
    def seller_name(self) -> str | None:
        return self.seller.full_name if self.seller else None

    @property
    def business_name(self) -> str | None:
        if self.enquiry is None or self.enquiry.biz_profile is None:
            return None
        return self.enquiry.biz_profile.business_name

    @property
    def product_name(self) -> str | None:
        return self.enquiry.product_name if self.enquiry else None

    @property
    def service_name(self) -> str | None:
        return self.enquiry.service_name if self.enquiry else None

    # -- Derived commercial fields -----------------------------------------

    @property
    def is_expired(self) -> bool:
        """True once the validity window has passed.

        Only open quotations can expire; ACCEPTED/REJECTED/CANCELLED are
        historical records and stay as they were decided.
        """
        if self.valid_until is None:
            return False
        if self.status not in (QuotationStatus.PENDING.value, QuotationStatus.SENT.value):
            return False
        valid_until = self.valid_until
        # Asyncpg can hand back a naive datetime even for timezone columns.
        if valid_until.tzinfo is None:
            valid_until = valid_until.replace(tzinfo=timezone.utc)
        return valid_until < datetime.now(timezone.utc)

    @property
    def unit_display(self) -> str:
        """Human label for the per-unit line, e.g. "per bulb" is left to the UI."""
        return "unit" if self.unit_price is not None else ""

    @property
    def delivery_display(self) -> str | None:
        if self.delivery_days is None:
            return None
        if self.delivery_days <= 0:
            return "Same day"
        if self.delivery_days == 1:
            return "1 day"
        return f"{self.delivery_days} days"

    @property
    def quantity_label(self) -> str:
        return f"{self.quantity} unit" if self.quantity == 1 else f"{self.quantity} units"

    def __repr__(self) -> str:
        return (
            f"<Quotation(id={self.id}, qty={self.quantity}, "
            f"unit_price={self.unit_price}, amount={self.amount}, status='{self.status}')>"
        )
