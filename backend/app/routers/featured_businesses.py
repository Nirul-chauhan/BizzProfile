from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.dependencies.auth import require_admin, get_current_user
from app.dependencies.database import get_db_session
from app.models.biz_profile import BizProfile
from app.models.category import Category, Subcategory
from app.models.social_link import SocialLink
from app.models.user import User
from app.schemas.biz_profile import PublicCategoryInfo, PublicSubcategoryInfo

router = APIRouter(prefix="/api/public/featured-businesses", tags=["featured-businesses"])
admin_router = APIRouter(prefix="/api/admin/featured-businesses", tags=["admin-featured-businesses"])


# ---- Public Schemas ----


class FeaturedBusinessCard(BaseModel):
    id: int
    business_name: str
    slug: str
    description: str | None
    profile_type: str
    address: str | None
    city: str | None
    state: str | None
    phone: str | None
    email: str | None
    website: str | None
    logo_url: str | None
    cover_image_url: str | None
    is_verified: bool
    featured_order: int | None = None
    category: PublicCategoryInfo
    subcategory: PublicSubcategoryInfo | None = None

    model_config = {"from_attributes": True}


def _serialize_featured_card(profile: BizProfile) -> dict:
    data = {
        "id": profile.id,
        "business_name": profile.business_name,
        "slug": profile.slug,
        "description": profile.description,
        "profile_type": profile.profile_type,
        "address": profile.address,
        "city": profile.city,
        "state": profile.state,
        "phone": profile.phone,
        "email": profile.email,
        "website": profile.website,
        "logo_url": profile.logo_url,
        "cover_image_url": profile.cover_image_url,
        "is_verified": profile.is_verified,
        "featured_order": profile.featured_order,
        "category": {
            "id": profile.category.id,
            "name": profile.category.name,
            "slug": profile.category.slug,
        },
        "subcategory": None,
    }
    if profile.subcategory:
        data["subcategory"] = {
            "id": profile.subcategory.id,
            "name": profile.subcategory.name,
            "slug": profile.subcategory.slug,
        }
    return data


@router.get("")
def get_featured_businesses(
    limit: int = 6,
    db: Session = Depends(get_db_session),
):
    profiles = db.execute(
        select(BizProfile)
        .options(
            joinedload(BizProfile.category.of_type(Category)),
            joinedload(BizProfile.subcategory.of_type(Subcategory)),
        )
        .where(BizProfile.is_featured == True)
        .where(BizProfile.is_verified == True)
        .where(BizProfile.is_public == True)
        .where(BizProfile.is_active == True)
        .order_by(BizProfile.featured_order.asc(), BizProfile.created_at.desc())
        .limit(limit)
    ).scalars().all()

    return {
        "items": [_serialize_featured_card(p) for p in profiles],
        "total": len(profiles),
    }


# ---- Admin Schemas ----


class AdminFeaturedBusinessCard(BaseModel):
    id: int
    business_name: str
    slug: str
    profile_type: str
    city: str | None
    state: str | None
    is_featured: bool
    featured_order: int | None = None
    category: PublicCategoryInfo

    model_config = {"from_attributes": True}


class ToggleFeaturedRequest(BaseModel):
    is_featured: bool
    featured_order: int | None = Field(None, ge=0)


class CreateFeaturedRequest(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    category_id: int
    description: str | None = Field(None, max_length=10000)
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)
    pincode: str | None = Field(None, max_length=20)
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    website: str | None = Field(None, max_length=500)
    logo_url: str | None = Field(None, max_length=500)
    cover_image_url: str | None = Field(None, max_length=500)
    profile_type: str = "COMPANY"
    featured_order: int | None = Field(None, ge=0)


@admin_router.get("")
def admin_list_businesses(
    search: str | None = None,
    is_featured: bool | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    query = (
        select(BizProfile)
        .options(
            joinedload(BizProfile.category.of_type(Category)),
        )
    )

    if search:
        query = query.where(BizProfile.business_name.ilike(f"%{search}%"))
    if is_featured is not None:
        query = query.where(BizProfile.is_featured == is_featured)

    total = db.execute(select(func.count()).select_from(query.subquery())).scalar() or 0

    profiles = db.execute(
        query.order_by(BizProfile.featured_order.asc(), BizProfile.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    items = []
    for p in profiles:
        items.append({
            "id": p.id,
            "business_name": p.business_name,
            "slug": p.slug,
            "profile_type": p.profile_type,
            "city": p.city,
            "state": p.state,
            "is_featured": p.is_featured,
            "featured_order": p.featured_order,
            "category": {
                "id": p.category.id,
                "name": p.category.name,
                "slug": p.category.slug,
            } if p.category else None,
        })

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@admin_router.patch("/{business_id}/toggle-featured")
def toggle_featured(
    business_id: int,
    body: ToggleFeaturedRequest,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    profile = db.execute(
        select(BizProfile).where(BizProfile.id == business_id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Business not found.")

    profile.is_featured = body.is_featured
    if body.featured_order is not None:
        profile.featured_order = body.featured_order
    elif body.is_featured and profile.featured_order is None:
        max_order = db.execute(
            select(func.max(BizProfile.featured_order)).where(BizProfile.is_featured == True)
        ).scalar() or 0
        profile.featured_order = max_order + 1

    db.commit()
    db.refresh(profile)

    return {
        "id": profile.id,
        "business_name": profile.business_name,
        "is_featured": profile.is_featured,
        "featured_order": profile.featured_order,
    }


@admin_router.put("/{business_id}")
def update_featured_business(
    business_id: int,
    body: CreateFeaturedRequest,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    profile = db.execute(
        select(BizProfile).where(BizProfile.id == business_id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Business not found.")

    existing = db.execute(
        select(BizProfile).where(BizProfile.slug == body.slug, BizProfile.id != business_id)
    ).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="A business with this slug already exists.")

    profile.category_id = body.category_id
    profile.business_name = body.business_name
    profile.slug = body.slug
    profile.description = body.description
    profile.address = body.address
    profile.city = body.city
    profile.state = body.state
    profile.country = body.country
    profile.pincode = body.pincode
    profile.phone = body.phone
    profile.email = body.email
    profile.website = body.website
    profile.logo_url = body.logo_url
    profile.cover_image_url = body.cover_image_url
    profile.profile_type = body.profile_type
    if body.featured_order is not None:
        profile.featured_order = body.featured_order

    db.commit()
    db.refresh(profile)

    return {
        "id": profile.id,
        "business_name": profile.business_name,
        "slug": profile.slug,
        "is_featured": profile.is_featured,
        "featured_order": profile.featured_order,
        "message": "Business updated successfully.",
    }


@admin_router.delete("/{business_id}")
def delete_featured_business(
    business_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    profile = db.execute(
        select(BizProfile).where(BizProfile.id == business_id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Business not found.")

    profile.is_featured = False
    profile.featured_order = None
    db.commit()

    return {"message": "Business removed from featured."}


@admin_router.post("")
def create_featured_business(
    body: CreateFeaturedRequest,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):

    existing = db.execute(
        select(BizProfile).where(BizProfile.slug == body.slug)
    ).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="A business with this slug already exists.")

    max_order = db.execute(
        select(func.max(BizProfile.featured_order)).where(BizProfile.is_featured == True)
    ).scalar() or 0

    profile = BizProfile(
        user_id=_admin.id,
        category_id=body.category_id,
        profile_type=body.profile_type,
        business_name=body.business_name,
        slug=body.slug,
        description=body.description,
        address=body.address,
        city=body.city,
        state=body.state,
        country=body.country,
        pincode=body.pincode,
        phone=body.phone,
        email=body.email,
        website=body.website,
        logo_url=body.logo_url,
        cover_image_url=body.cover_image_url,
        is_featured=True,
        featured_order=body.featured_order if body.featured_order is not None else max_order + 1,
        is_public=True,
        is_active=True,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return {
        "id": profile.id,
        "business_name": profile.business_name,
        "slug": profile.slug,
        "is_featured": profile.is_featured,
        "featured_order": profile.featured_order,
    }
