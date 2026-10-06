"""Seller-specific Pydantic schemas."""
from datetime import datetime, time
from typing import Literal

from pydantic import BaseModel, field_validator, model_validator

from app.models.product import ProductStatus, ProductApprovalStatus
from app.models.service import ServiceStatus, ServiceApprovalStatus
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
    """Live PostgreSQL counters scoped to the requesting seller's own records."""

    # Listings
    total_products: int
    active_products: int
    best_seller_products: int
    total_services: int
    active_services: int
    # Pipeline
    pending_approval_products: int
    pending_approval_services: int
    # Enquiries
    total_enquiries: int
    pending_enquiries: int
    new_enquiries: int
    # Commercial
    total_quotations: int
    pending_quotations: int
    accepted_quotations: int
    # Media
    promotional_videos: int
    approved_promotional_videos: int
    # Profile health
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
    """Seller-supplied product fields.

    `status`, `approval_status` and the merchandising flags (is_trending /
    is_best_seller) are deliberately absent: a new listing always starts as a
    DRAFT awaiting admin approval, and merchandising is an admin decision.
    """

    name: str
    category_id: int
    subcategory_id: int | None = None
    description: str | None = None
    price: float | None = None
    price_unit: str | None = None
    is_available: bool = True

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


class SellerProductUpdate(BaseModel):
    """Editable product fields. Approval and merchandising fields are admin-only."""

    name: str | None = None
    category_id: int | None = None
    subcategory_id: int | None = None
    description: str | None = None
    price: float | None = None
    price_unit: str | None = None
    is_available: bool | None = None

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
    approval_status: str = "PENDING"
    rejection_reason: str | None = None
    submitted_at: datetime | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    images: list[SellerProductImageResponse] = []

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------

class SellerServiceCreate(BaseModel):
    """Seller-supplied service fields.

    As with products, `status`, `approval_status` and the merchandising flags
    are admin-only. A new service always starts unpublished and pending review.
    """

    name: str
    category_id: int
    subcategory_id: int | None = None
    description: str | None = None
    price: float | None = None
    price_min: float | None = None
    price_max: float | None = None
    price_unit: str | None = None
    is_available: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1 or len(v) > 255:
            raise ValueError("name must be between 1 and 255 characters")
        return v

    @field_validator("price", "price_min", "price_max")
    @classmethod
    def validate_prices(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("price must be non-negative")
        return v

    @model_validator(mode="after")
    def validate_price_range(self):
        if self.price_min is not None and self.price_max is not None:
            if self.price_min > self.price_max:
                raise ValueError("price_min must be <= price_max")
        return self


class SellerServiceUpdate(BaseModel):
    """Editable service fields. Approval and merchandising fields are admin-only."""

    name: str | None = None
    category_id: int | None = None
    subcategory_id: int | None = None
    description: str | None = None
    price: float | None = None
    price_min: float | None = None
    price_max: float | None = None
    price_unit: str | None = None
    is_available: bool | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) < 1 or len(v) > 255:
                raise ValueError("name must be between 1 and 255 characters")
        return v

    @field_validator("price", "price_min", "price_max")
    @classmethod
    def validate_prices(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("price must be non-negative")
        return v

    @model_validator(mode="after")
    def validate_price_range(self):
        if self.price_min is not None and self.price_max is not None:
            if self.price_min > self.price_max:
                raise ValueError("price_min must be <= price_max")
        return self


class SellerServiceResponse(BaseModel):
    id: int
    profile_id: int
    category_id: int
    subcategory_id: int | None
    name: str
    slug: str | None = None
    description: str | None
    price_min: float | None
    price_max: float | None
    price_unit: str | None
    is_available: bool
    is_trending: bool
    is_featured: bool
    status: str
    approval_status: str = "PENDING"
    rejection_reason: str | None = None
    submitted_at: datetime | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Listing filters (approval workflow)
# ---------------------------------------------------------------------------

class SellerProductFilter(BaseModel):
    approval_status: str | None = None
    search: str | None = None

    @field_validator("approval_status")
    @classmethod
    def validate_approval_status(cls, v: str | None) -> str | None:
        if v is not None:
            allowed = {s.value for s in ProductApprovalStatus}
            if v not in allowed:
                raise ValueError(
                    f"approval_status must be one of: {', '.join(sorted(allowed))}"
                )
        return v


class SellerServiceFilter(BaseModel):
    approval_status: str | None = None
    search: str | None = None

    @field_validator("approval_status")
    @classmethod
    def validate_approval_status(cls, v: str | None) -> str | None:
        if v is not None:
            allowed = {s.value for s in ServiceApprovalStatus}
            if v not in allowed:
                raise ValueError(
                    f"approval_status must be one of: {', '.join(sorted(allowed))}"
                )
        return v


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
    seller_id: int
    profile_id: int
    product_id: int | None
    service_id: int | None
    requirement_id: int | None
    requirement: str | None = None
    location: str | None = None
    message: str
    quantity: int
    status: str
    buyer_name: str | None = None
    buyer_email: str | None = None
    buyer_city: str | None = None
    buyer_location: str | None = None
    product_name: str | None = None
    service_name: str | None = None
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
    # A quotation can be priced one of two ways:
    #   * per unit  -> quantity + unit_price (total is derived)
    #   * lump sum  -> amount on its own
    # Providing both is allowed, but then they must agree so the seller cannot
    # quote a total that contradicts its own line items.
    quantity: int | None = None
    unit_price: float | None = None
    amount: float | None = None
    description: str | None = None
    terms: str | None = None
    delivery_days: int | None = None
    valid_days: int | None = None
    valid_until: datetime | None = None

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int | None) -> int | None:
        if v is not None and (v < 1 or v > 1_000_000):
            raise ValueError("quantity must be between 1 and 1000000")
        return v

    @field_validator("unit_price")
    @classmethod
    def validate_unit_price(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("unit_price must be positive")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("amount must be positive")
        return v

    @field_validator("delivery_days")
    @classmethod
    def validate_delivery_days(cls, v: int | None) -> int | None:
        if v is not None and (v < 0 or v > 365):
            raise ValueError("delivery_days must be between 0 and 365")
        return v

    @field_validator("valid_days")
    @classmethod
    def validate_valid_days(cls, v: int | None) -> int | None:
        if v is not None and (v < 1 or v > 365):
            raise ValueError("valid_days must be between 1 and 365")
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) > 2000:
                raise ValueError("description must be at most 2000 characters")
        return v or None

    @field_validator("terms")
    @classmethod
    def validate_terms(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) > 2000:
                raise ValueError("terms must be at most 2000 characters")
        return v or None

    @model_validator(mode="after")
    def check_pricing(self) -> "SellerQuotationCreate":
        if self.quantity is None and self.unit_price is None and self.amount is None:
            raise ValueError(
                "provide quantity and unit_price, or a total amount"
            )
        if self.unit_price is not None and self.quantity is None:
            raise ValueError("unit_price requires quantity")
        if self.quantity is not None and self.unit_price is None and self.amount is None:
            raise ValueError("quantity requires unit_price or amount")
        if (
            self.quantity is not None
            and self.unit_price is not None
            and self.amount is not None
        ):
            expected = round(self.quantity * self.unit_price, 2)
            if abs(expected - self.amount) > 0.01:
                raise ValueError(
                    f"amount ({self.amount}) does not match quantity x unit_price ({expected})"
                )
        return self


class SellerQuotationUpdate(BaseModel):
    quantity: int | None = None
    unit_price: float | None = None
    amount: float | None = None
    description: str | None = None
    terms: str | None = None
    delivery_days: int | None = None
    valid_days: int | None = None
    valid_until: datetime | None = None
    status: str | None = None

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int | None) -> int | None:
        if v is not None and (v < 1 or v > 1_000_000):
            raise ValueError("quantity must be between 1 and 1000000")
        return v

    @field_validator("unit_price")
    @classmethod
    def validate_unit_price(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("unit_price must be positive")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("amount must be positive")
        return v

    @field_validator("delivery_days")
    @classmethod
    def validate_delivery_days(cls, v: int | None) -> int | None:
        if v is not None and (v < 0 or v > 365):
            raise ValueError("delivery_days must be between 0 and 365")
        return v

    @field_validator("valid_days")
    @classmethod
    def validate_valid_days(cls, v: int | None) -> int | None:
        if v is not None and (v < 1 or v > 365):
            raise ValueError("valid_days must be between 1 and 365")
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
    quantity: int
    unit_price: float | None = None
    delivery_days: int | None = None
    valid_days: int | None = None
    description: str | None
    terms: str | None = None
    valid_until: datetime | None
    status: str
    is_expired: bool = False
    quantity_label: str = ""
    delivery_display: str | None = None
    buyer_name: str | None = None
    business_name: str | None = None
    product_name: str | None = None
    service_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SellerEnquiryListResponse(BaseModel):
    items: list[SellerEnquiryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class SellerQuotationListResponse(BaseModel):
    items: list[SellerQuotationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


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
