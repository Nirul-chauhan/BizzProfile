import re
import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db_session
from app.models.service_listing import ServiceCategory, ServiceSubcategory, ServiceListing, ListingApprovalStatus
from app.models.user import User

router = APIRouter(prefix="/api/admin/services-listing", tags=["admin-services-listing"])


def _slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text.lower().strip())
    return re.sub(r"[\s_]+", "-", slug)


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    color: Optional[str] = None
    sort_order: int = 0


class SubcategoryCreate(BaseModel):
    name: str
    category_id: int
    description: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: int = 0


class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    full_details: Optional[str] = None
    image_url: Optional[str] = None
    category_id: int
    subcategory_id: Optional[int] = None
    provider_name: Optional[str] = None
    contact_number: Optional[str] = None
    price: Optional[float] = None
    price_unit: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius_km: Optional[float] = None
    society_name: Optional[str] = None
    profile_id: Optional[int] = None
    is_active: bool = False
    is_featured: bool = False
    featured_order: int = 0
    sort_order: int = 0


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    full_details: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    provider_name: Optional[str] = None
    contact_number: Optional[str] = None
    price: Optional[float] = None
    price_unit: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius_km: Optional[float] = None
    society_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    featured_order: Optional[int] = None
    sort_order: Optional[int] = None


class ReviewRequest(BaseModel):
    approval_status: str
    rejection_reason: Optional[str] = None


def _serialize_category(cat: ServiceCategory) -> dict:
    return {
        "id": cat.id,
        "name": cat.name,
        "slug": cat.slug,
        "description": cat.description,
        "icon": cat.icon,
        "image_url": cat.image_url,
        "color": cat.color,
        "is_active": cat.is_active,
        "sort_order": cat.sort_order,
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
        "is_active": sub.is_active,
        "sort_order": sub.sort_order,
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
        "profile_id": svc.profile_id,
        "added_by_user_id": svc.added_by_user_id,
        "approval_status": svc.approval_status,
        "rejection_reason": svc.rejection_reason,
        "is_active": svc.is_active,
        "is_featured": svc.is_featured,
        "featured_order": svc.featured_order,
        "sort_order": svc.sort_order,
        "view_count": svc.view_count,
        "created_at": svc.created_at.isoformat() if svc.created_at else None,
    }


# ─── Category Endpoints ──────────────────────────────────────


@router.get("/categories")
def admin_list_categories(
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    cats = db.execute(
        select(ServiceCategory).options(joinedload(ServiceCategory.subcategories))
        .order_by(ServiceCategory.sort_order, ServiceCategory.name)
    ).scalars().unique().all()
    result = []
    for c in cats:
        data = _serialize_category(c)
        data["subcategories"] = [_serialize_subcategory(s) for s in (c.subcategories or [])]
        data["subcategory_count"] = len(data["subcategories"])
        result.append(data)
    return result


@router.post("/categories", status_code=status.HTTP_201_CREATED)
def admin_create_category(
    req: CategoryCreate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    slug = _slugify(req.name)
    existing = db.execute(select(ServiceCategory).where(ServiceCategory.slug == slug)).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    cat = ServiceCategory(
        name=req.name,
        slug=slug,
        description=req.description,
        icon=req.icon,
        image_url=req.image_url,
        color=req.color,
        sort_order=req.sort_order,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return _serialize_category(cat)


@router.put("/categories/{cat_id}")
def admin_update_category(
    cat_id: int,
    req: CategoryCreate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    cat = db.get(ServiceCategory, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.name = req.name
    cat.slug = _slugify(req.name)
    cat.description = req.description
    cat.icon = req.icon
    cat.image_url = req.image_url
    cat.color = req.color
    cat.sort_order = req.sort_order
    db.commit()
    db.refresh(cat)
    return _serialize_category(cat)


@router.delete("/categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_category(
    cat_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    cat = db.get(ServiceCategory, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()


@router.patch("/categories/{cat_id}/toggle")
def admin_toggle_category(
    cat_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    cat = db.get(ServiceCategory, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.is_active = not cat.is_active
    db.commit()
    return {"is_active": cat.is_active}


# ─── Subcategory Endpoints ──────────────────────────────────


@router.post("/subcategories", status_code=status.HTTP_201_CREATED)
def admin_create_subcategory(
    req: SubcategoryCreate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    cat = db.get(ServiceCategory, req.category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    slug = _slugify(req.name)
    existing = db.execute(select(ServiceSubcategory).where(ServiceSubcategory.slug == slug)).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Subcategory with this name already exists")
    sub = ServiceSubcategory(
        category_id=req.category_id,
        name=req.name,
        slug=slug,
        description=req.description,
        icon=req.icon,
        image_url=req.image_url,
        sort_order=req.sort_order,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return _serialize_subcategory(sub)


@router.put("/subcategories/{sub_id}")
def admin_update_subcategory(
    sub_id: int,
    req: SubcategoryCreate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    sub = db.get(ServiceSubcategory, sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    sub.name = req.name
    sub.slug = _slugify(req.name)
    sub.category_id = req.category_id
    sub.description = req.description
    sub.icon = req.icon
    sub.image_url = req.image_url
    sub.sort_order = req.sort_order
    db.commit()
    db.refresh(sub)
    return _serialize_subcategory(sub)


@router.delete("/subcategories/{sub_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_subcategory(
    sub_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    sub = db.get(ServiceSubcategory, sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    db.delete(sub)
    db.commit()


# ─── Service Endpoints ──────────────────────────────────────


@router.get("/services")
def admin_list_services(
    search: str | None = None,
    category_id: int | None = None,
    approval_status: str | None = None,
    is_active: bool | None = None,
    is_featured: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    query = select(ServiceListing).options(
        joinedload(ServiceListing.category),
        joinedload(ServiceListing.subcategory),
    )
    if search:
        query = query.where(ServiceListing.name.ilike(f"%{search}%"))
    if category_id:
        query = query.where(ServiceListing.category_id == category_id)
    if approval_status:
        query = query.where(ServiceListing.approval_status == approval_status)
    if is_active is not None:
        query = query.where(ServiceListing.is_active == is_active)
    if is_featured is not None:
        query = query.where(ServiceListing.is_featured == is_featured)

    total = db.execute(select(func.count()).select_from(query.subquery())).scalar() or 0
    offset = (page - 1) * page_size
    query = query.order_by(ServiceListing.created_at.desc()).offset(offset).limit(page_size)
    services = db.execute(query).scalars().unique().all()
    return {
        "items": [_serialize_service(s) for s in services],
        "total": total,
        "page": page,
        "total_pages": math.ceil(total / page_size) if total > 0 else 0,
    }


@router.post("/services", status_code=status.HTTP_201_CREATED)
def admin_create_service(
    req: ServiceCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_admin),
):
    slug = _slugify(req.name)
    existing = db.execute(select(ServiceListing).where(ServiceListing.slug == slug)).scalars().first()
    if existing:
        slug = f"{slug}-{existing.id + 1}"
    svc = ServiceListing(
        name=req.name,
        slug=slug,
        description=req.description,
        full_details=req.full_details,
        image_url=req.image_url,
        category_id=req.category_id,
        subcategory_id=req.subcategory_id,
        provider_name=req.provider_name,
        contact_number=req.contact_number,
        price=req.price,
        price_unit=req.price_unit,
        city=req.city,
        state=req.state,
        country=req.country,
        address=req.address,
        latitude=req.latitude,
        longitude=req.longitude,
        service_radius_km=req.service_radius_km,
        society_name=req.society_name,
        profile_id=req.profile_id,
        added_by_user_id=current_user.id,
        approval_status=ListingApprovalStatus.APPROVED.value,
        is_active=req.is_active,
        is_featured=req.is_featured,
        featured_order=req.featured_order,
        sort_order=req.sort_order,
    )
    db.add(svc)
    db.commit()
    svc = db.execute(
        select(ServiceListing)
        .where(ServiceListing.id == svc.id)
        .options(joinedload(ServiceListing.category), joinedload(ServiceListing.subcategory))
    ).scalars().unique().first()
    return _serialize_service(svc)


@router.put("/services/{svc_id}")
def admin_update_service(
    svc_id: int,
    req: ServiceUpdate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = db.get(ServiceListing, svc_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    data = req.model_dump(exclude_unset=True)
    if "name" in data:
        data["slug"] = _slugify(data["name"])
    for key, value in data.items():
        setattr(svc, key, value)
    db.commit()
    svc = db.execute(
        select(ServiceListing)
        .where(ServiceListing.id == svc.id)
        .options(joinedload(ServiceListing.category), joinedload(ServiceListing.subcategory))
    ).scalars().unique().first()
    return _serialize_service(svc)


@router.delete("/services/{svc_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_service(
    svc_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = db.get(ServiceListing, svc_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(svc)
    db.commit()


@router.patch("/services/{svc_id}/toggle-active")
def admin_toggle_active(
    svc_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = db.get(ServiceListing, svc_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    svc.is_active = not svc.is_active
    db.commit()
    return {"is_active": svc.is_active}


@router.patch("/services/{svc_id}/toggle-featured")
def admin_toggle_featured(
    svc_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = db.get(ServiceListing, svc_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    svc.is_featured = not svc.is_featured
    db.commit()
    return {"is_featured": svc.is_featured}


@router.patch("/services/{svc_id}/review")
def admin_review_service(
    svc_id: int,
    req: ReviewRequest,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = db.get(ServiceListing, svc_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    if req.approval_status not in ("APPROVED", "REJECTED", "PENDING"):
        raise HTTPException(status_code=400, detail="Invalid approval status")
    svc.approval_status = req.approval_status
    svc.rejection_reason = req.rejection_reason
    if req.approval_status == ListingApprovalStatus.APPROVED.value:
        svc.is_active = True
    db.commit()
    svc = db.execute(
        select(ServiceListing)
        .where(ServiceListing.id == svc.id)
        .options(joinedload(ServiceListing.category), joinedload(ServiceListing.subcategory))
    ).scalars().unique().first()
    return _serialize_service(svc)


@router.get("/requests")
def admin_list_requests(
    approval_status: str = "",
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    query = select(ServiceListing).options(
        joinedload(ServiceListing.category),
        joinedload(ServiceListing.subcategory),
    )
    if approval_status:
        query = query.where(ServiceListing.approval_status == approval_status)
    query = query.where(ServiceListing.approval_status != ListingApprovalStatus.APPROVED.value)
    query = query.order_by(ServiceListing.created_at.desc())
    services = db.execute(query).scalars().unique().all()
    return [_serialize_service(s) for s in services]
