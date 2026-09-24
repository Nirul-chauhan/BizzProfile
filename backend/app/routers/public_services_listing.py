import re
import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.dependencies.database import get_db_session
from app.models.category import Category, Subcategory
from app.models.service_listing import ServiceCategory, ServiceSubcategory, ServiceListing, ListingApprovalStatus

router = APIRouter(prefix="/api/public/services-listing", tags=["public-services-listing"])


def _slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text.lower().strip())
    return re.sub(r"[\s_]+", "-", slug)


def _serialize_category(cat: ServiceCategory) -> dict:
    return {
        "id": cat.id,
        "name": cat.name,
        "slug": cat.slug,
        "description": cat.description,
        "icon": cat.icon,
        "image_url": cat.image_url,
        "color": cat.color,
        "sort_order": cat.sort_order,
        "subcategory_count": len([s for s in cat.subcategories if s.is_active]) if cat.subcategories else 0,
        "subcategories": [_serialize_subcategory(s) for s in cat.subcategories if s.is_active] if cat.subcategories else [],
    }


def _serialize_subcategory(sub: ServiceSubcategory) -> dict:
    return {
        "id": sub.id,
        "category_id": sub.category_id,
        "name": sub.name,
        "slug": sub.slug,
        "description": sub.description,
        "icon": sub.icon,
        "image_url": sub.image_url,
        "sort_order": sub.sort_order,
        "service_count": len([s for s in sub.services if s.approval_status == ListingApprovalStatus.APPROVED.value and s.is_active]) if sub.services else 0,
    }


def _serialize_service(svc: ServiceListing) -> dict:
    return {
        "id": svc.id,
        "name": svc.name,
        "slug": svc.slug,
        "description": svc.description,
        "full_details": svc.full_details,
        "image_url": svc.image_url,
        "category_id": svc.category_id,
        "category_name": svc.category.name if svc.category else None,
        "category_slug": svc.category.slug if svc.category else None,
        "subcategory_id": svc.subcategory_id,
        "subcategory_name": svc.subcategory.name if svc.subcategory else None,
        "provider_name": svc.provider_name,
        "contact_number": svc.contact_number,
        "price": svc.price,
        "price_unit": svc.price_unit,
        "city": svc.city,
        "state": svc.state,
        "country": svc.country,
        "address": svc.address,
        "latitude": svc.latitude,
        "longitude": svc.longitude,
        "service_radius_km": svc.service_radius_km,
        "society_name": svc.society_name,
        "approval_status": svc.approval_status,
        "is_active": svc.is_active,
        "is_featured": svc.is_featured,
        "featured_order": svc.featured_order,
        "sort_order": svc.sort_order,
        "view_count": svc.view_count,
        "created_at": svc.created_at.isoformat() if svc.created_at else None,
    }


@router.get("/categories")
def list_categories(
    db: Session = Depends(get_db_session),
):
    cats = db.execute(
        select(ServiceCategory)
        .where(ServiceCategory.is_active == True)
        .options(joinedload(ServiceCategory.subcategories))
        .order_by(ServiceCategory.sort_order, ServiceCategory.name)
    ).scalars().unique().all()
    return [_serialize_category(c) for c in cats]


@router.get("/categories/{slug}")
def get_category(
    slug: str,
    db: Session = Depends(get_db_session),
):
    cat = db.execute(
        select(ServiceCategory)
        .where(ServiceCategory.slug == slug)
        .options(joinedload(ServiceCategory.subcategories))
    ).scalars().unique().first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return _serialize_category(cat)


@router.get("/subcategories/{slug}")
def get_subcategory(
    slug: str,
    db: Session = Depends(get_db_session),
):
    sub = db.execute(
        select(ServiceSubcategory)
        .where(ServiceSubcategory.slug == slug)
        .options(joinedload(ServiceSubcategory.category))
    ).scalars().unique().first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    return _serialize_subcategory(sub)


@router.get("")
def list_services(
    category_slug: str | None = Query(None),
    subcategory_slug: str | None = Query(None),
    city: str | None = Query(None),
    search: str | None = Query(None),
    is_featured: bool | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_session),
):
    query = (
        select(ServiceListing)
        .where(ServiceListing.approval_status == ListingApprovalStatus.APPROVED.value)
        .where(ServiceListing.is_active == True)
        .options(joinedload(ServiceListing.category), joinedload(ServiceListing.subcategory))
    )
    if category_slug:
        query = query.join(ServiceCategory).where(ServiceCategory.slug == category_slug)
    if subcategory_slug:
        query = query.join(ServiceSubcategory, ServiceListing.subcategory_id == ServiceSubcategory.id).where(ServiceSubcategory.slug == subcategory_slug)
    if city:
        query = query.where(ServiceListing.city.ilike(f"%{city}%"))
    if search:
        query = query.where(ServiceListing.name.ilike(f"%{search}%"))
    if is_featured is not None:
        query = query.where(ServiceListing.is_featured == is_featured)

    total = db.execute(select(func.count()).select_from(query.subquery())).scalar() or 0
    offset = (page - 1) * page_size
    query = query.order_by(ServiceListing.sort_order, ServiceListing.created_at.desc()).offset(offset).limit(page_size)
    services = db.execute(query).scalars().unique().all()
    return {
        "items": [_serialize_service(s) for s in services],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total > 0 else 0,
    }


@router.get("/featured")
def featured_services(
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db_session),
):
    services = db.execute(
        select(ServiceListing)
        .where(ServiceListing.approval_status == ListingApprovalStatus.APPROVED.value)
        .where(ServiceListing.is_active == True)
        .where(ServiceListing.is_featured == True)
        .options(joinedload(ServiceListing.category), joinedload(ServiceListing.subcategory))
        .order_by(ServiceListing.featured_order, ServiceListing.created_at.desc())
        .limit(limit)
    ).scalars().unique().all()
    return [_serialize_service(s) for s in services]


@router.get("/count")
def count_services(
    db: Session = Depends(get_db_session),
):
    total = db.execute(
        select(func.count(ServiceListing.id))
        .where(ServiceListing.approval_status == ListingApprovalStatus.APPROVED.value)
        .where(ServiceListing.is_active == True)
    ).scalar() or 0
    return {"total": total}


@router.get("/by-subcategory")
def list_services_by_product_subcategory(
    subcategory_id: int | None = Query(None, description="ID from the main product/business taxonomy subcategories"),
    category_id: int | None = Query(None, description="ID from the main product/business taxonomy categories"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db_session),
):
    """Match services to the main business/product category taxonomy.

    Services store their own service_categories / service_subcategories, so
    matching is done by name: a service is shown when its service category or
    service subcategory name matches the clicked subcategory/category name.
    """
    match_names: list[str] = []
    if subcategory_id:
        sub = db.execute(select(Subcategory).where(Subcategory.id == subcategory_id, Subcategory.is_active == True)).scalar_one_or_none()
        if sub:
            match_names.append(sub.name)
            if sub.category_id:
                parent = db.execute(select(Category).where(Category.id == sub.category_id)).scalar_one_or_none()
                if parent:
                    match_names.append(parent.name)
    elif category_id:
        cat = db.execute(select(Category).where(Category.id == category_id, Category.is_active == True)).scalar_one_or_none()
        if cat:
            match_names.append(cat.name)
    else:
        return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}

    patterns = [f"%{name.strip()}%" for name in match_names if name and name.strip()]
    if not patterns:
        return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}

    conditions = [ServiceListing.approval_status == ListingApprovalStatus.APPROVED.value, ServiceListing.is_active == True]
    conditions.append(or_(*[ServiceSubcategory.name.ilike(p) for p in patterns], *[ServiceCategory.name.ilike(p) for p in patterns]))

    total = db.execute(
        select(func.count(ServiceListing.id))
        .outerjoin(ServiceSubcategory, ServiceListing.subcategory_id == ServiceSubcategory.id)
        .outerjoin(ServiceCategory, ServiceListing.category_id == ServiceCategory.id)
        .where(*conditions)
    ).scalar() or 0

    services = db.execute(
        select(ServiceListing)
        .outerjoin(ServiceSubcategory, ServiceListing.subcategory_id == ServiceSubcategory.id)
        .outerjoin(ServiceCategory, ServiceListing.category_id == ServiceCategory.id)
        .options(joinedload(ServiceListing.category), joinedload(ServiceListing.subcategory))
        .where(*conditions)
        .order_by(ServiceListing.sort_order, ServiceListing.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().unique().all()

    return {
        "items": [_serialize_service(s) for s in services],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total > 0 else 0,
    }


@router.get("/{slug}")
def get_service(
    slug: str,
    db: Session = Depends(get_db_session),
):
    svc = db.execute(
        select(ServiceListing)
        .where(ServiceListing.slug == slug)
        .options(
            joinedload(ServiceListing.category),
            joinedload(ServiceListing.subcategory),
        )
    ).scalars().unique().first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    svc.view_count = (svc.view_count or 0) + 1
    db.commit()
    return _serialize_service(svc)
