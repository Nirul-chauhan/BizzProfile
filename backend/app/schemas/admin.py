from datetime import datetime
from pydantic import BaseModel, Field


# ---- User Schemas ----


class RoleResponse(BaseModel):
    id: int
    name: str
    description: str | None

    model_config = {"from_attributes": True}


class AdminUserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    mobile: str | None
    is_email_verified: bool
    is_mobile_verified: bool
    is_active: bool
    role: RoleResponse
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdminUserUpdateRole(BaseModel):
    role_name: str = Field(..., pattern=r"^(ADMIN|BUYER|SELLER|USER)$")


class AdminUserToggleActive(BaseModel):
    is_active: bool


# ---- Profile Schemas ----


class AdminProfileResponse(BaseModel):
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
    city: str | None
    state: str | None
    country: str | None
    is_public: bool
    is_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdminProfileToggleActive(BaseModel):
    is_active: bool


class AdminProfileTogglePublic(BaseModel):
    is_public: bool


class AdminProfileToggleVerified(BaseModel):
    is_verified: bool


# ---- Stats Schema ----


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_profiles: int
    active_profiles: int
    pending_documents: int
    total_documents: int
    profiles_by_type: dict[str, int]
    recent_users: int
    recent_profiles: int
