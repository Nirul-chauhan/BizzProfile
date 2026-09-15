from datetime import datetime
from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field, field_validator, model_validator


# ---- Profile-Type Detail Schemas ----


class CompanyDetail(BaseModel):
    company_registration_number: str | None = Field(None, max_length=100)
    legal_name: str | None = Field(None, max_length=255)
    company_type: str | None = Field(None, max_length=100)

    model_config = {"from_attributes": True}


class IndividualDetail(BaseModel):
    professional_name: str | None = Field(None, max_length=255)
    profession: str | None = Field(None, max_length=100)
    experience_years: int | None = Field(None, ge=0, le=100)
    services: str | None = Field(None, max_length=10000)

    model_config = {"from_attributes": True}


class MsmeDetail(BaseModel):
    msme_number: str | None = Field(None, max_length=100)
    business_type: str | None = Field(None, max_length=100)
    industry: str | None = Field(None, max_length=100)

    model_config = {"from_attributes": True}


# ---- Request Schemas ----


class BizProfileCreate(BaseModel):
    category_id: int
    subcategory_id: int | None = None
    profile_type: Literal["COMPANY", "INDIVIDUAL", "MSME"]
    business_name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=10000)
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    website: str | None = Field(None, max_length=500)
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)
    pincode: str | None = Field(None, max_length=20)
    latitude: float | None = None
    longitude: float | None = None
    logo_url: str | None = Field(None, max_length=500)
    cover_image_url: str | None = Field(None, max_length=500)
    is_public: bool = True
    company_detail: CompanyDetail | None = None
    individual_detail: IndividualDetail | None = None
    msme_detail: MsmeDetail | None = None

    @model_validator(mode="after")
    def validate_details_match_profile_type(self):
        profile_type = self.profile_type
        has_company = self.company_detail is not None
        has_individual = self.individual_detail is not None
        has_msme = self.msme_detail is not None

        if profile_type == "COMPANY":
            if has_individual:
                raise ValueError("individual_detail cannot be provided for a COMPANY profile.")
            if has_msme:
                raise ValueError("msme_detail cannot be provided for a COMPANY profile.")
            if not has_company:
                raise ValueError("company_detail is required for a COMPANY profile.")
        elif profile_type == "INDIVIDUAL":
            if has_company:
                raise ValueError("company_detail cannot be provided for an INDIVIDUAL profile.")
            if has_msme:
                raise ValueError("msme_detail cannot be provided for an INDIVIDUAL profile.")
            if not has_individual:
                raise ValueError("individual_detail is required for an INDIVIDUAL profile.")
        elif profile_type == "MSME":
            if has_company:
                raise ValueError("company_detail cannot be provided for an MSME profile.")
            if has_individual:
                raise ValueError("individual_detail cannot be provided for an MSME profile.")
            if not has_msme:
                raise ValueError("msme_detail is required for an MSME profile.")

        return self


class BizProfileUpdate(BaseModel):
    category_id: int | None = None
    subcategory_id: int | None = None
    business_name: str | None = Field(None, min_length=1, max_length=255)
    slug: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=10000)
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    website: str | None = Field(None, max_length=500)
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)
    pincode: str | None = Field(None, max_length=20)
    latitude: float | None = None
    longitude: float | None = None
    logo_url: str | None = Field(None, max_length=500)
    cover_image_url: str | None = Field(None, max_length=500)
    is_public: bool | None = None
    company_detail: CompanyDetail | None = None
    individual_detail: IndividualDetail | None = None
    msme_detail: MsmeDetail | None = None


# ---- Response Schemas ----


class BizProfileResponse(BaseModel):
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
    is_featured: bool = False
    featured_order: int | None = None
    created_at: datetime
    updated_at: datetime
    company_detail: CompanyDetail | None = None
    individual_detail: IndividualDetail | None = None
    msme_detail: MsmeDetail | None = None

    model_config = {"from_attributes": True}


# ---- Public Response Schema ----


class PublicCategoryInfo(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class PublicSubcategoryInfo(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class PublicSocialLinkInfo(BaseModel):
    platform: str
    url: str

    model_config = {"from_attributes": True}


class PublicBizProfileResponse(BaseModel):
    id: int
    business_name: str
    slug: str
    description: str | None
    profile_type: str
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
    is_verified: bool
    created_at: datetime
    category: PublicCategoryInfo
    subcategory: PublicSubcategoryInfo | None = None
    social_links: list[PublicSocialLinkInfo] = []
    company_detail: CompanyDetail | None = None
    individual_detail: IndividualDetail | None = None
    msme_detail: MsmeDetail | None = None

    model_config = {"from_attributes": True}
