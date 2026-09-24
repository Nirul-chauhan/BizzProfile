from datetime import datetime
from pydantic import BaseModel, Field


class TrendingVideoCreate(BaseModel):
    platform: str = Field(..., pattern=r"^(YOUTUBE|INSTAGRAM|FACEBOOK|UPLOAD)$")
    video_url: str = Field(..., max_length=500)
    embed_id: str | None = Field(None, max_length=100)
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    thumbnail_url: str | None = Field(None, max_length=500)
    company_name: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)
    category_id: int | None = None
    profile_id: int | None = None
    is_active: bool = True
    is_trending: bool = False
    sort_order: int = 0


class TrendingVideoUpdate(BaseModel):
    platform: str | None = Field(None, pattern=r"^(YOUTUBE|INSTAGRAM|FACEBOOK|UPLOAD)$")
    video_url: str | None = Field(None, max_length=500)
    embed_id: str | None = Field(None, max_length=100)
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    thumbnail_url: str | None = Field(None, max_length=500)
    company_name: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)
    category_id: int | None = None
    profile_id: int | None = None
    is_active: bool | None = None
    is_trending: bool | None = None
    sort_order: int | None = None


class TrendingVideoReview(BaseModel):
    approval_status: str = Field(..., pattern=r"^(APPROVED|REJECTED)$")
    rejection_reason: str | None = Field(None, max_length=500)


class TrendingVideoResponse(BaseModel):
    id: int
    platform: str
    video_url: str
    embed_id: str | None
    title: str | None
    description: str | None
    thumbnail_url: str | None
    company_name: str | None
    city: str | None
    state: str | None
    country: str | None
    category_id: int | None
    added_by_user_id: int | None
    profile_id: int | None
    approval_status: str
    rejection_reason: str | None
    is_active: bool
    is_trending: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
