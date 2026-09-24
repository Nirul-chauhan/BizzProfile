import re
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.dependencies.auth import require_seller, require_buyer, require_buyer_or_admin
from app.dependencies.database import get_db_session
from app.models.service_listing import ServiceListing, ListingApprovalStatus
from app.models.biz_profile import BizProfile
from app.models.user import User

router = APIRouter(prefix="/api/services-listing", tags=["services-listing"])


def _slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text.lower().strip())
    return re.sub(r"[\s_]+", "-", slug)


class ServiceCreateRequest(BaseModel):
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


class ServiceUpdateRequest(BaseModel):
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


def _serialize(svc: ServiceListing) -> dict:
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
        "approval_status": svc.approval_status,
        "rejection_reason": svc.rejection_reason,
        "is_active": svc.is_active,
        "is_featured": svc.is_featured,
        "sort_order": svc.sort_order,
        "view_count": svc.view_count,
        "created_at": svc.created_at.isoformat() if svc.created_at else None,
    }


def _create_service(req: ServiceCreateRequest, user: User, db: Session) -> ServiceListing:
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
        added_by_user_id=user.id,
        approval_status=ListingApprovalStatus.PENDING.value,
        is_active=False,
    )
    db.add(svc)
    db.commit()
    svc = db.execute(
        select(ServiceListing)
        .where(ServiceListing.id == svc.id)
        .options(joinedload(ServiceListing.category), joinedload(ServiceListing.subcategory))
    ).scalars().unique().first()
    return svc


# ─── Seller Endpoints ──────────────────────────────────────


@router.get("/seller/list")
def seller_list_services(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_seller),
):
    services = db.execute(
        select(ServiceListing)
        .where(ServiceListing.added_by_user_id == current_user.id)
        .options(joinedload(ServiceListing.category), joinedload(ServiceListing.subcategory))
        .order_by(ServiceListing.created_at.desc())
    ).scalars().unique().all()
    return [_serialize(s) for s in services]


@router.post("/seller/upload", status_code=status.HTTP_201_CREATED)
def seller_create_service(
    req: ServiceCreateRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_seller),
):
    if req.profile_id:
        profile = db.get(BizProfile, req.profile_id)
        if not profile or profile.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only create services for your own business.")
    svc = _create_service(req, current_user, db)
    return _serialize(svc)


@router.put("/seller/{svc_id}")
def seller_update_service(
    svc_id: int,
    req: ServiceUpdateRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_seller),
):
    svc = db.get(ServiceListing, svc_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    if svc.added_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own services.")
    if svc.approval_status == ListingApprovalStatus.APPROVED.value:
        raise HTTPException(status_code=400, detail="Cannot edit an approved service. Contact admin.")
    data = req.model_dump(exclude_unset=True)
    if "name" in data:
        data["slug"] = _slugify(data["name"])
    for key, value in data.items():
        setattr(svc, key, value)
    svc.approval_status = ListingApprovalStatus.PENDING.value
    db.commit()
    svc = db.execute(
        select(ServiceListing)
        .where(ServiceListing.id == svc.id)
        .options(joinedload(ServiceListing.category), joinedload(ServiceListing.subcategory))
    ).scalars().unique().first()
    return _serialize(svc)


@router.delete("/seller/{svc_id}", status_code=status.HTTP_204_NO_CONTENT)
def seller_delete_service(
    svc_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_seller),
):
    svc = db.get(ServiceListing, svc_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    if svc.added_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own services.")
    db.delete(svc)
    db.commit()


# ─── Buyer Endpoints ──────────────────────────────────────


@router.get("/buyer/list")
def buyer_list_services(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_buyer_or_admin),
):
    services = db.execute(
        select(ServiceListing)
        .where(ServiceListing.added_by_user_id == current_user.id)
        .options(joinedload(ServiceListing.category), joinedload(ServiceListing.subcategory))
        .order_by(ServiceListing.created_at.desc())
    ).scalars().unique().all()
    return [_serialize(s) for s in services]


@router.post("/buyer/upload", status_code=status.HTTP_201_CREATED)
def buyer_create_service(
    req: ServiceCreateRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_buyer_or_admin),
):
    if req.profile_id:
        profile = db.get(BizProfile, req.profile_id)
        if not profile or profile.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only create services for your own business.")
    svc = _create_service(req, current_user, db)
    return _serialize(svc)


@router.put("/buyer/{svc_id}")
def buyer_update_service(
    svc_id: int,
    req: ServiceUpdateRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_buyer_or_admin),
):
    svc = db.get(ServiceListing, svc_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    if svc.added_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own services.")
    data = req.model_dump(exclude_unset=True)
    if "name" in data:
        data["slug"] = _slugify(data["name"])
    for key, value in data.items():
        setattr(svc, key, value)
    svc.approval_status = ListingApprovalStatus.PENDING.value
    db.commit()
    svc = db.execute(
        select(ServiceListing)
        .where(ServiceListing.id == svc.id)
        .options(joinedload(ServiceListing.category), joinedload(ServiceListing.subcategory))
    ).scalars().unique().first()
    return _serialize(svc)


@router.delete("/buyer/{svc_id}", status_code=status.HTTP_204_NO_CONTENT)
def buyer_delete_service(
    svc_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_buyer_or_admin),
):
    svc = db.get(ServiceListing, svc_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    if svc.added_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own services.")
    db.delete(svc)
    db.commit()
