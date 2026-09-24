from datetime import datetime
from pydantic import BaseModel, Field


class BannerCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    subtitle: str | None = Field(None, max_length=500)
    cta_text: str | None = Field(None, max_length=100)
    cta_url: str | None = Field(None, max_length=500)
    image_url: str | None = Field(None, max_length=500)
    gradient: str | None = Field(
        default="linear-gradient(135deg, #4f46e5, #6366f1)",
        max_length=200,
    )
    is_active: bool = True
    sort_order: int = 0


class BannerUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    subtitle: str | None = Field(None, max_length=500)
    cta_text: str | None = Field(None, max_length=100)
    cta_url: str | None = Field(None, max_length=500)
    image_url: str | None = Field(None, max_length=500)
    gradient: str | None = Field(None, max_length=200)
    is_active: bool | None = None
    sort_order: int | None = None


class BannerResponse(BaseModel):
    id: int
    title: str
    subtitle: str | None
    cta_text: str | None
    cta_url: str | None
    image_url: str | None
    gradient: str | None
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
