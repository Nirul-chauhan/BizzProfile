"""Seller-specific Pydantic schemas."""
from datetime import datetime, time
from typing import Literal

from pydantic import BaseModel, field_validator, model_validator

from app.models.product import ProductStatus
from app.models.service import ServiceStatus
from app.models.enquiry import EnquiryStatus
from app.models.quotation import QuotationStatus


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------

class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20

    @field_validator("page")
    @classmethod
    def validate_page(cls, v: int) -> int:
        if v < 1:
            raise ValueError("page must be >= 1")
        return v

    @field_validator("page_size")
    @classmethod
    def validate_page_size(cls, v: int) -> int:
        if v < 1 or v > 100:
            raise ValueError("page_size must be between 1 and 100")
        return v


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

class SellerDashboardStats(BaseModel):
    total_products: int
    active_products: int
    total_services: int
    active_services: int
    new_enquiries: int
    pending_quotations: int
    accepted_quotations: int
    profile_completion: int
    verification_status: str


# ---------------------------------------------------------------------------
# Business Profile
# ---------------------------------------------------------------------------

class SellerProfileCreate(BaseModel):
    business_name: str
    slug: str | None = None
    category_id: int
    subcategory_id: int | None = None
    description: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    pincode: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None

    @field_validator("business_name")
    @classmethod
    def validate_business_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1 or len(v) > 255:
            raise ValueError("business_name must be between 1 and 255 characters")
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

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        if v is not None:
            import re
            pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
            if not re.match(pattern, v):
                raise ValueError("Invalid email format")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 20:
            raise ValueError("phone must be at most 20 characters")
        return v

    @field_validator("website")
    @classmethod
    def validate_website(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith(("http://", "https://")):
            raise ValueError("website must start with http:// or https://")
        return v


class SellerProfileUpdate(BaseModel):
    business_name: str | None = None
    slug: str | None = None
    category_id: int | None = None
    subcategory_id: int | None = None
    description: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    pincode: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    is_public: bool | None = None

    @field_validator("business_name")
    @classmethod
    def validate_business_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) < 1 or len(v) > 255:
                raise ValueError("business_name must be between 1 and 255 characters")
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

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        if v is not None:
            import re
            pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
            if not re.match(pattern, v):
                raise ValueError("Invalid email format")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 20:
            raise ValueError("phone must be at most 20 characters")
        return v

    @field_validator("website")
    @classmethod
    def validate_website(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith(("http://", "https://")):
            raise ValueError("website must start with http:// or https://")
        return v


class SellerProfileResponse(BaseModel):
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

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------

class SellerProductCreate(BaseModel):
    name: str
    category_id: int
    subcategory_id: int | None = None
    description: str | None = None
    price: float | None = None
    price_unit: str | None = None
    is_available: bool = True
    status: str = "ACTIVE"

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1 or len(v) > 255:
            raise ValueError("name must be between 1 and 255 characters")
        return v

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("price must be non-negative")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {s.value for s in ProductStatus}
        if v not in allowed:
            raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return v


class SellerProductUpdate(BaseModel):
    name: str | None = None
    category_id: int | None = None
    subcategory_id: int | None = None
    description: str | None = None
    price: float | None = None
    price_unit: str | None = None
    is_available: bool | None = None
    status: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) < 1 or len(v) > 255:
                raise ValueError("name must be between 1 and 255 characters")
        return v

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("price must be non-negative")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None:
            allowed = {s.value for s in ProductStatus}
            if v not in allowed:
                raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return v


class SellerProductImageResponse(BaseModel):
    id: int
    product_id: int
    image_url: str
    sort_order: int
    is_primary: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SellerProductResponse(BaseModel):
    id: int
    profile_id: int
    category_id: int
    subcategory_id: int | None
    name: str
    slug: str
    description: str | None
    price: float | None
    price_unit: str | None
    is_available: bool
    is_trending: bool = False
    is_best_seller: bool = False
    best_seller_order: int = 0
    trending_order: int = 0
    status: str
    created_at: datetime
    updated_at: datetime
    images: list[SellerProductImageResponse] = []

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------

class SellerServiceCreate(BaseModel):
    name: str
    category_id: int
    subcategory_id: int | None = None
    description: str | None = None
    price: float | None = None
    price_min: float | None = None
    price_max: float | None = None
    price_unit: str | None = None
    is_available: bool = True
    is_trending: bool = False
    is_featured: bool = False
    status: str = "ACTIVE"

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1 or len(v) > 255:
            raise ValueError("name must be between 1 and 255 characters")
        return v

    @field_validator("price_min", "price_max")
    @classmethod
    def validate_prices(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("price must be non-negative")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {s.value for s in ServiceStatus}
        if v not in allowed:
            raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return v

    @model_validator(mode="after")
    def validate_price_range(self):
        if self.price_min is not None and self.price_max is not None:
            if self.price_min > self.price_max:
                raise ValueError("price_min must be <= price_max")
        return self


class SellerServiceUpdate(BaseModel):
    name: str | None = None
    category_id: int | None = None
    subcategory_id: int | None = None
    description: str | None = None
    price: float | None = None
    price_min: float | None = None
    price_max: float | None = None
    price_unit: str | None = None
    is_available: bool | None = None
    is_trending: bool | None = None
    is_featured: bool | None = None
    status: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) < 1 or len(v) > 255:
                raise ValueError("name must be between 1 and 255 characters")
        return v

    @field_validator("price_min", "price_max")
    @classmethod
    def validate_prices(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("price must be non-negative")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None:
            allowed = {s.value for s in ServiceStatus}
            if v not in allowed:
                raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return v


class SellerServiceResponse(BaseModel):
    id: int
    profile_id: int
    category_id: int
    subcategory_id: int | None
    name: str
    description: str | None
    price_min: float | None
    price_max: float | None
    price_unit: str | None
    is_available: bool
    is_trending: bool
    is_featured: bool
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Business Hours
# ---------------------------------------------------------------------------

class SellerBusinessHourCreate(BaseModel):
    day_of_week: int
    open_time: str | None = None
    close_time: str | None = None
    is_closed: bool = False

    @field_validator("day_of_week")
    @classmethod
    def validate_day(cls, v: int) -> int:
        if v < 0 or v > 6:
            raise ValueError("day_of_week must be 0 (Monday) to 6 (Sunday)")
        return v

    @field_validator("open_time", "close_time")
    @classmethod
    def validate_time(cls, v: str | None) -> str | None:
        if v is not None:
            parts = v.split(":")
            if len(parts) != 2:
                raise ValueError("time must be in HH:MM format")
            h, m = int(parts[0]), int(parts[1])
            if h < 0 or h > 23 or m < 0 or m > 59:
                raise ValueError("invalid time value")
        return v


class SellerBusinessHourUpdate(BaseModel):
    open_time: str | None = None
    close_time: str | None = None
    is_closed: bool | None = None

    @field_validator("open_time", "close_time")
    @classmethod
    def validate_time(cls, v: str | None) -> str | None:
        if v is not None:
            parts = v.split(":")
            if len(parts) != 2:
                raise ValueError("time must be in HH:MM format")
            h, m = int(parts[0]), int(parts[1])
            if h < 0 or h > 23 or m < 0 or m > 59:
                raise ValueError("invalid time value")
        return v


class SellerBusinessHourResponse(BaseModel):
    id: int
    biz_profile_id: int
    day_of_week: int
    open_time: time | None
    close_time: time | None
    is_closed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Enquiries
# ---------------------------------------------------------------------------

class SellerEnquiryResponse(BaseModel):
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


class SellerEnquiryUpdateStatus(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {s.value for s in EnquiryStatus}
        if v not in allowed:
            raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return v


# ---------------------------------------------------------------------------
# Quotations
# ---------------------------------------------------------------------------

class SellerQuotationCreate(BaseModel):
    enquiry_id: int
    amount: float
    description: str | None = None
    valid_until: datetime | None = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be positive")
        return v


class SellerQuotationUpdate(BaseModel):
    amount: float | None = None
    description: str | None = None
    valid_until: datetime | None = None
    status: str | None = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("amount must be positive")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None:
            allowed = {"CANCELLED"}
            if v not in allowed:
                raise ValueError("seller can only cancel a quotation")
        return v


class SellerQuotationResponse(BaseModel):
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
# Requirements (seller sees public/buyer requirements)
# ---------------------------------------------------------------------------

class SellerRequirementResponse(BaseModel):
    id: int
    buyer_id: int
    title: str
    description: str | None
    category_id: int | None
    subcategory_id: int | None
    city: str | None
    state: str | None
    country: str | None
    budget: float | None
    budget_unit: str | None
    status: str
    expires_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

class SellerMessageCreate(BaseModel):
    receiver_id: int
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1 or len(v) > 5000:
            raise ValueError("content must be between 1 and 5000 characters")
        return v


class SellerMessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Profile Settings (user-level)
# ---------------------------------------------------------------------------

class SellerProfileSettingsUpdate(BaseModel):
    full_name: str | None = None
    mobile: str | None = None
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


class SellerProfileSettingsResponse(BaseModel):
    id: int
    full_name: str
    email: str
    mobile: str | None
    city: str | None
    state: str | None
    country: str | None
    profile_pic: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
