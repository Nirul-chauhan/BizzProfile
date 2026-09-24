from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_mobile", "mobile"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False, index=True)
    society_id: Mapped[int | None] = mapped_column(ForeignKey("societies.id"), nullable=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    mobile: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    block_tower: Mapped[str | None] = mapped_column(String(50), nullable=True)
    flat_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    profile_pic: Mapped[str | None] = mapped_column(String(500), nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_phone_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_mobile_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_first_login: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    role: Mapped["Role"] = relationship(back_populates="users")  # noqa: F821
    society: Mapped["Society | None"] = relationship("Society", back_populates="users")  # noqa: F821

    def __repr__(self) -> str:
        return f"<User {self.email}>"


# Reverse relationships — defined after class to avoid forward reference issues.
# SQLAlchemy resolves string-based targets lazily.
User.favorites = relationship(
    "Favorite", back_populates="user", passive_deletes=True
)
User.requirements = relationship(
    "Requirement", back_populates="buyer", passive_deletes=True
)
User.reviews = relationship(
    "Review", back_populates="buyer", passive_deletes=True
)
User.enquiries = relationship(
    "Enquiry", back_populates="buyer", passive_deletes=True
)
User.messages_sent = relationship(
    "Message", foreign_keys="Message.sender_id", back_populates="sender", passive_deletes=True
)
User.messages_received = relationship(
    "Message", foreign_keys="Message.receiver_id", back_populates="receiver", passive_deletes=True
)
User.quotations_as_seller = relationship(
    "Quotation", foreign_keys="Quotation.seller_id", back_populates="seller", passive_deletes=True
)
User.quotations_as_buyer = relationship(
    "Quotation", foreign_keys="Quotation.buyer_id", back_populates="buyer", passive_deletes=True
)
