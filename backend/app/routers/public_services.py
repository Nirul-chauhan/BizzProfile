"""Public services browsing router."""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func, case
from sqlalchemy.orm import Session, joinedload

from app.dependencies.database import get_db_session
from app.models.service import BizService, ServiceStatus
from app.models.biz_profile import BizProfile
from app.models.category import Category, Subcategory

router = APIRouter(prefix="/api/public/services", tags=["public-services"])


class PublicCategoryInfo(BaseModel):
    id: int
    name: str
    slug: str
    icon: str | None = None

    model_config = {"from_attributes": True}


class PublicSubcategoryInfo(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class ServiceCard(BaseModel):
    id: int
    name: str
    description: str | None
    price_min: float | None
    price_max: float | None
    price_unit: str | None
    is_trending: bool
    is_featured: bool
    category: PublicCategoryInfo | None = None
    subcategory: PublicSubcategoryInfo | None = None
    business_name: str | None = None
    business_slug: str | None = None
    business_logo: str | None = None
    business_city: str | None = None
    is_verified: bool = False

    model_config = {"from_attributes": True}


def _serialize_service(svc: BizService) -> dict:
    profile = svc.biz_profile
    return {
        "id": svc.id,
        "name": svc.name,
        "description": svc.description,
        "price_min": svc.price_min,
        "price_max": svc.price_max,
        "price_unit": svc.price_unit,
        "is_trending": svc.is_trending,
        "is_featured": svc.is_featured,
        "category": {
            "id": svc.category.id,
            "name": svc.category.name,
            "slug": svc.category.slug,
            "icon": svc.category.icon,
        }
        if svc.category
        else None,
        "subcategory": {
            "id": svc.subcategory.id,
            "name": svc.subcategory.name,
            "slug": svc.subcategory.slug,
        }
        if svc.subcategory
        else None,
        "business_name": profile.business_name if profile else None,
        "business_slug": profile.slug if profile else None,
        "business_logo": profile.logo_url if profile else None,
        "business_city": profile.city if profile else None,
        "is_verified": profile.is_verified if profile else False,
    }


@router.get("", response_model=list[ServiceCard])
def list_public_services(
    category_id: int | None = None,
    subcategory_id: int | None = None,
    is_trending: bool | None = None,
    is_featured: bool | None = None,
    city: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    radius_km: float = 50,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_session),
):
    q = (
        select(BizService)
        .join(BizProfile, BizService.profile_id == BizProfile.id)
        .outerjoin(Category, BizService.category_id == Category.id)
        .options(
            joinedload(BizService.biz_profile),
            joinedload(BizService.category),
            joinedload(BizService.subcategory),
        )
        .where(
            BizService.status == ServiceStatus.ACTIVE.value,
            BizService.is_available == True,
            BizProfile.is_active == True,
            BizProfile.is_public == True,
        )
    )

    if category_id:
        q = q.where(BizService.category_id == category_id)
    if subcategory_id:
        q = q.where(BizService.subcategory_id == subcategory_id)
    if is_trending is not None:
        q = q.where(BizService.is_trending == is_trending)
    if is_featured is not None:
        q = q.where(BizService.is_featured == is_featured)
    if city:
        q = q.where(func.lower(BizProfile.city) == city.lower())

    if latitude is not None and longitude is not None:
        lat_rad = func.radians(latitude)
        lng_rad = func.radians(longitude)
        haversine = (
            6371
            * func.acos(
                func.cos(lat_rad)
                * func.cos(func.radians(BizProfile.latitude))
                * func.cos(func.radians(BizProfile.longitude) - lng_rad)
                + func.sin(lat_rad)
                * func.sin(func.radians(BizProfile.latitude))
            )
        )
        q = q.where(
            BizProfile.latitude.isnot(None),
            BizProfile.longitude.isnot(None),
            haversine <= radius_km,
        )
        q = q.order_by(haversine)
    else:
        q = q.order_by(
            BizService.is_featured.desc(),
            BizService.is_trending.desc(),
            BizService.created_at.desc(),
        )

    offset = (page - 1) * page_size
    q = q.offset(offset).limit(page_size)

    results = db.execute(q).unique().scalars().all()
    return [_serialize_service(s) for s in results]


@router.get("/trending", response_model=list[ServiceCard])
def list_trending_services(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db_session),
):
    q = (
        select(BizService)
        .join(BizProfile, BizService.profile_id == BizProfile.id)
        .outerjoin(Category, BizService.category_id == Category.id)
        .options(
            joinedload(BizService.biz_profile),
            joinedload(BizService.category),
            joinedload(BizService.subcategory),
        )
        .where(
            BizService.status == ServiceStatus.ACTIVE.value,
            BizService.is_available == True,
            BizService.is_trending == True,
            BizProfile.is_active == True,
            BizProfile.is_public == True,
        )
        .order_by(BizService.created_at.desc())
        .limit(limit)
    )
    results = db.execute(q).unique().scalars().all()
    return [_serialize_service(s) for s in results]


@router.get("/featured", response_model=list[ServiceCard])
def list_featured_services(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db_session),
):
    q = (
        select(BizService)
        .join(BizProfile, BizService.profile_id == BizProfile.id)
        .outerjoin(Category, BizService.category_id == Category.id)
        .options(
            joinedload(BizService.biz_profile),
            joinedload(BizService.category),
            joinedload(BizService.subcategory),
        )
        .where(
            BizService.status == ServiceStatus.ACTIVE.value,
            BizService.is_available == True,
            BizService.is_featured == True,
            BizProfile.is_active == True,
            BizProfile.is_public == True,
        )
        .order_by(BizService.created_at.desc())
        .limit(limit)
    )
    results = db.execute(q).unique().scalars().all()
    return [_serialize_service(s) for s in results]
