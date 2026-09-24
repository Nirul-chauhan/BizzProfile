"""Buyer-specific Pydantic schemas."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator, model_validator

from app.models.requirement import RequirementStatus
from app.models.enquiry import EnquiryStatus
from app.models.quotation import QuotationStatus
from app.models.favorite import FavoriteTargetType


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

class BuyerDashboardStats(BaseModel):
    active_requirements: int
    enquiries_sent: int
    pending_quotations: int
    accepted_quotations: int
    favorite_count: int
    unread_messages: int


# ---------------------------------------------------------------------------
# Profile (user-level settings)
# ---------------------------------------------------------------------------

class BuyerProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str
    mobile: str | None
    society: str | None = None
    block_tower: str | None = None
    flat_number: str | None = None
    city: str | None
    state: str | None
    country: str | None
    profile_pic: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def _resolve_society(self):
        s = self.society
        if s is not None and not isinstance(s, str):
            self.society = getattr(s, "name", str(s))
        return self


class BuyerProfileUpdate(BaseModel):
    full_name: str | None = None
    mobile: str | None = None
    society: str | None = None
    block_tower: str | None = None
    flat_number: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    profile_pic: str | None = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) < 1 or len(v) > 150:
                raise ValueError("full_name must be between 1 and 150 characters")
        return v

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 20:
            raise ValueError("mobile must be at most 20 characters")
        return v


# ---------------------------------------------------------------------------
# Requirements
# ---------------------------------------------------------------------------

class BuyerRequirementCreate(BaseModel):
    title: str
    description: str | None = None
    category_id: int | None = None
    subcategory_id: int | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    budget: float | None = None
    budget_unit: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1 or len(v) > 255:
            raise ValueError("title must be between 1 and 255 characters")
        return v

    @field_validator("budget")
    @classmethod
    def validate_budget(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("budget must be non-negative")
        return v

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: float | None) -> float | None:
        if v is not None and (v < -90 or v > 90):
            raise ValueError("latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: float | None) -> float | None:
        if v is not None and (v < -180 or v > 180):
            raise ValueError("longitude must be between -180 and 180")
        return v


class BuyerRequirementUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category_id: int | None = None
    subcategory_id: int | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    budget: float | None = None
    budget_unit: str | None = None
    status: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) < 1 or len(v) > 255:
                raise ValueError("title must be between 1 and 255 characters")
        return v

    @field_validator("budget")
    @classmethod
    def validate_budget(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("budget must be non-negative")
        return v

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: float | None) -> float | None:
        if v is not None and (v < -90 or v > 90):
            raise ValueError("latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: float | None) -> float | None:
        if v is not None and (v < -180 or v > 180):
            raise ValueError("longitude must be between -180 and 180")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None:
            allowed = {s.value for s in RequirementStatus}
            if v not in allowed:
                raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return v


class BuyerRequirementResponse(BaseModel):
    id: int
    buyer_id: int
    title: str
    description: str | None
    category_id: int | None
    subcategory_id: int | None
    city: str | None
    state: str | None
    country: str | None
    latitude: float | None
    longitude: float | None
    budget: float | None
    budget_unit: str | None
    status: str
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Enquiries
# ---------------------------------------------------------------------------

class BuyerEnquiryCreate(BaseModel):
    profile_id: int
    product_id: int | None = None
    service_id: int | None = None
    requirement_id: int | None = None
    message: str

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1 or len(v) > 5000:
            raise ValueError("message must be between 1 and 5000 characters")
        return v


class BuyerEnquiryResponse(BaseModel):
    id: int
    buyer_id: int
    profile_id: int
    product_id: int | None
    service_id: int | None
    requirement_id: int | None
    message: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Favorites
# ---------------------------------------------------------------------------

class BuyerFavoriteCreate(BaseModel):
    target_type: str
    target_id: int

    @field_validator("target_type")
    @classmethod
    def validate_target_type(cls, v: str) -> str:
        allowed = {t.value for t in FavoriteTargetType}
        if v not in allowed:
            raise ValueError(f"target_type must be one of: {', '.join(sorted(allowed))}")
        return v

    @field_validator("target_id")
    @classmethod
    def validate_target_id(cls, v: int) -> int:
        if v < 1:
            raise ValueError("target_id must be positive")
        return v


class BuyerFavoriteResponse(BaseModel):
    id: int
    user_id: int
    target_type: str
    target_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Quotations
# ---------------------------------------------------------------------------

class BuyerQuotationResponse(BaseModel):
    id: int
    enquiry_id: int
    seller_id: int
    buyer_id: int
    amount: float
    description: str | None
    valid_until: datetime | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

class BuyerMessageCreate(BaseModel):
    receiver_id: int
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1 or len(v) > 5000:
            raise ValueError("content must be between 1 and 5000 characters")
        return v


class BuyerMessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
