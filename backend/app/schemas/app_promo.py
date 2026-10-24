from datetime import datetime

from pydantic import BaseModel, Field


class AppPromoUpdate(BaseModel):
    heading: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=500)
    image_url: str | None = Field(None, max_length=500)
    qr_code_url: str | None = Field(None, max_length=500)
    google_play_url: str | None = Field(None, max_length=500)
    app_store_url: str | None = Field(None, max_length=500)
    is_active: bool | None = None


class AppPromoResponse(BaseModel):
    id: int
    heading: str
    description: str | None
    image_url: str | None
    qr_code_url: str | None
    google_play_url: str | None
    app_store_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
