from datetime import datetime
from pydantic import BaseModel, Field, model_validator


# ---- Request Schemas ----


class CategoryCreate(BaseModel):
    parent_id: int | None = None
    name: str = Field(..., min_length=1, max_length=150)
    slug: str = Field(..., min_length=1, max_length=150)
    description: str | None = Field(None, max_length=500)
    is_active: bool = True
    icon: str | None = Field(None, max_length=50)
    logo_url: str | None = Field(None, max_length=500)
    is_popular: bool = False
    is_trending: bool = False
    trending_order: int = 0
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    parent_id: int | None = None
    name: str | None = Field(None, min_length=1, max_length=150)
    slug: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = Field(None, max_length=500)
    is_active: bool | None = None
    icon: str | None = Field(None, max_length=50)
    logo_url: str | None = Field(None, max_length=500)
    is_popular: bool | None = None
    is_trending: bool | None = None
    trending_order: int | None = None
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
    parent_id: int | None = None
    name: str
    slug: str
    description: str | None
    is_active: bool
    icon: str | None
    logo_url: str | None
    is_popular: bool
    is_trending: bool
    trending_order: int
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CategoryWithSubcategories(CategoryResponse):
    subcategories: list[SubcategoryResponse] = []


# ---- Tree Schemas (nested hierarchy) ----


class CategoryTreeNode(BaseModel):
    """A category node with nested children and subcategories."""
    id: int
    parent_id: int | None = None
    name: str
    slug: str
    description: str | None = None
    is_active: bool = True
    icon: str | None = None
    logo_url: str | None = None
    is_popular: bool = False
    is_trending: bool = False
    trending_order: int = 0
    sort_order: int = 0
    children: list["CategoryTreeNode"] = []
    subcategories: list[SubcategoryResponse] = []

    model_config = {"from_attributes": True}


class CategoryBreadcrumb(BaseModel):
    """Single breadcrumb item."""
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}
