from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AppPromo(Base):
    """Singleton row holding the homepage "Download Our BizzProfile App" content."""

    __tablename__ = "app_promo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    heading: Mapped[str] = mapped_column(
        String(200), nullable=False, default="Download Our BizzProfile App"
    )
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    qr_code_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    google_play_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    app_store_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
