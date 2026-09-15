from datetime import datetime
from pydantic import BaseModel, Field


class NearbyQuery(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="User's current latitude")
    longitude: float = Field(..., ge=-180, le=180, description="User's current longitude")
    radius_km: float = Field(default=10.0, gt=0, le=100, description="Search radius in km (max 100)")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Results per page (max 100)")


class NearbyProfileItem(BaseModel):
    id: int
    user_id: int
    category_id: int
    subcategory_id: int | None
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
    distance_km: float

    model_config = {"from_attributes": True}


class NearbyResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    results: list[NearbyProfileItem]
