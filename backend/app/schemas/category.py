from datetime import datetime
from pydantic import BaseModel, Field


# ---- Request Schemas ----


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    slug: str = Field(..., min_length=1, max_length=150)
    description: str | None = Field(None, max_length=500)
    is_active: bool = True
    icon: str | None = Field(None, max_length=50)
    logo_url: str | None = Field(None, max_length=500)
    is_popular: bool = False
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    slug: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = Field(None, max_length=500)
    is_active: bool | None = None
    icon: str | None = Field(None, max_length=50)
    logo_url: str | None = Field(None, max_length=500)
    is_popular: bool | None = None
    sort_order: int | None = None


class SubcategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    slug: str = Field(..., min_length=1, max_length=150)
    description: str | None = Field(None, max_length=500)
    is_active: bool = True
    keywords: str | None = Field(None, max_length=1000)
    sort_order: int = 0
    is_trending: bool = False


class SubcategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    slug: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = Field(None, max_length=500)
    is_active: bool | None = None
    keywords: str | None = Field(None, max_length=1000)
    sort_order: int | None = None
    is_trending: bool | None = None
    category_id: int | None = None


# ---- Response Schemas ----


class SubcategoryResponse(BaseModel):
    id: int
    category_id: int
    name: str
    slug: str
    description: str | None
    is_active: bool
    keywords: str | None
    sort_order: int
    is_trending: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    is_active: bool
    icon: str | None
    logo_url: str | None
    is_popular: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CategoryWithSubcategories(CategoryResponse):
    subcategories: list[SubcategoryResponse] = []
