from datetime import datetime
from pydantic import BaseModel, Field


class SearchQuery(BaseModel):
    q: str | None = Field(None, max_length=200, description="Keyword search")
    category_id: int | None = Field(None, description="Filter by category ID")
    subcategory_id: int | None = Field(None, description="Filter by subcategory ID")
    profile_type: str | None = Field(None, description="Filter by profile type")
    city: str | None = Field(None, max_length=100, description="Filter by city")
    state: str | None = Field(None, max_length=100, description="Filter by state")
    country: str | None = Field(None, max_length=100, description="Filter by country")
    pincode: str | None = Field(None, max_length=20, description="Filter by pincode")
    latitude: float | None = Field(None, ge=-90, le=90, description="User latitude for nearby")
    longitude: float | None = Field(None, ge=-180, le=180, description="User longitude for nearby")
    radius_km: float | None = Field(None, gt=0, le=100, description="Search radius in km")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Results per page")


class SearchProfileItem(BaseModel):
    id: int
    user_id: int
    category_id: int
    category_name: str | None = None
    subcategory_id: int | None
    subcategory_name: str | None = None
    profile_type: str
    business_name: str
    slug: str
    description: str | None
    phone: str | None
    email: str | None
    website: str | None
    address: str | None
    city: str | None
    state: str | None
    country: str | None
    pincode: str | None
    latitude: float | None
    longitude: float | None
    logo_url: str | None
    cover_image_url: str | None
    is_public: bool
    is_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    distance_km: float | None = None

    model_config = {"from_attributes": True}


class SearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list[SearchProfileItem]
