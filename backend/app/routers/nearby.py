import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.dependencies.database import get_db_session
from app.models.biz_profile import BizProfile
from app.models.category import Category
from app.models.product import Product, ProductStatus
from app.models.service import BizService, ServiceApprovalStatus, ServiceStatus
from app.models.service_listing import (
    ListingApprovalStatus,
    ServiceListing,
)
from app.repositories.location import LocationRepository
from app.schemas.nearby import NearbyProfileItem, NearbyResponse

router = APIRouter(prefix="/api/profiles", tags=["profiles"])
# Standalone nearby router: this endpoint is not scoped to a single entity, so it
# must not sit behind the /api/profiles prefix.
nearby_all_router = APIRouter(prefix="/api", tags=["nearby"])


def _effective_lat(row, profile):
    """Latitude the distance was measured from: the row's own, else the profile's."""
    if row.latitude is not None:
        return row.latitude
    return profile.latitude if profile is not None else None


def _effective_lng(row, profile):
    """Longitude the distance was measured from: the row's own, else the profile's."""
    if row.longitude is not None:
        return row.longitude
    return profile.longitude if profile is not None else None


def _serialize_profile(profile) -> dict:
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "category_id": profile.category_id,
        "subcategory_id": profile.subcategory_id,
        "profile_type": profile.profile_type,
        "business_name": profile.business_name,
        "slug": profile.slug,
        "description": profile.description,
        "phone": profile.phone,
        "email": profile.email,
        "website": profile.website,
        "address": profile.address,
        "city": profile.city,
        "state": profile.state,
        "country": profile.country,
        "pincode": profile.pincode,
        "latitude": profile.latitude,
        "longitude": profile.longitude,
        "logo_url": profile.logo_url,
        "cover_image_url": profile.cover_image_url,
        "is_public": profile.is_public,
        "is_verified": profile.is_verified,
        "is_active": profile.is_active,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at,
    }


@router.get("/nearby", response_model=NearbyResponse)
def get_nearby_profiles(
    latitude: float = Query(..., ge=-90, le=90, description="User latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="User longitude"),
    radius_km: float = Query(default=10.0, gt=0, le=100, description="Search radius in km"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db_session),
):
    repo = LocationRepository(db)
    results, total = repo.find_nearby(
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        page=page,
        page_size=page_size,
    )

    items = []
    for result in results:
        data = _serialize_profile(result.profile)
        data["distance_km"] = result.distance_km
        items.append(NearbyProfileItem.model_validate(data))

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return NearbyResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        results=items,
    )


@nearby_all_router.get("/nearby")
def get_nearby_all(
    latitude: float = Query(..., ge=-90, le=90, description="User latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="User longitude"),
    radius_km: float = Query(default=5.0, gt=0, le=100, description="Search radius in km"),
    limit: int = Query(default=20, ge=1, le=100, description="Max results per group"),
    db: Session = Depends(get_db_session),
):
    """Nearby Products, Services and Businesses around a point.

    Products inherit the location of the business that owns them. Services use
    their own coordinates when set, otherwise the owning business's.

    Unlike /api/profiles/nearby this does not require `is_verified`: an
    unverified-but-legitimate shop should still be findable nearby. Verification
    is surfaced in the payload so the UI can badge it.
    """
    repo = LocationRepository(db)
    # Businesses, products and listings all resolve their position through the
    # owning business; services may carry one of their own.
    profile_ref = repo.profile_ref()

    # ── Businesses ──────────────────────────────────────────────────────────
    biz_ref = profile_ref
    biz_dist = repo.distance_km(latitude, longitude, biz_ref).label("distance_km")
    biz_q = (
        select(BizProfile, biz_dist)
        .outerjoin(Category, BizProfile.category_id == Category.id)
        .options(joinedload(BizProfile.category))
        .where(
            BizProfile.is_public.is_(True),
            BizProfile.is_active.is_(True),
            repo.has_location(biz_ref),
            repo.within_radius(latitude, longitude, biz_ref, radius_km),
        )
        .order_by(biz_dist)
        .limit(limit)
    )
    biz_rows = db.execute(biz_q).unique().all()
    businesses = [
        {
            "id": r[0].id,
            "slug": r[0].slug,
            "business_name": r[0].business_name,
            "profile_type": r[0].profile_type,
            "description": r[0].description,
            "logo_url": r[0].logo_url,
            "cover_image_url": r[0].cover_image_url,
            "category_name": r[0].category.name if r[0].category else None,
            "address": r[0].address,
            "city": r[0].city,
            "state": r[0].state,
            "phone": r[0].phone,
            "is_verified": r[0].is_verified,
            "latitude": r[0].latitude,
            "longitude": r[0].longitude,
            "distance_km": round(r[1], 2),
        }
        for r in biz_rows
    ]

    # ── Products (located via their owning business) ─────────────────────────
    prod_dist = repo.distance_km(latitude, longitude, profile_ref).label("distance_km")
    prod_q = (
        select(Product, prod_dist)
        .join(BizProfile, Product.profile_id == BizProfile.id)
        .outerjoin(Category, Product.category_id == Category.id)
        .options(
            joinedload(Product.images),
            joinedload(Product.biz_profile),
            joinedload(Product.category),
        )
        .where(
            Product.status == ProductStatus.ACTIVE.value,
            Product.is_available.is_(True),
            BizProfile.is_public.is_(True),
            BizProfile.is_active.is_(True),
            repo.has_location(profile_ref),
            repo.within_radius(latitude, longitude, profile_ref, radius_km),
        )
        .order_by(prod_dist)
        .limit(limit)
    )
    prod_rows = db.execute(prod_q).unique().all()
    products = []
    for r in prod_rows:
        p, dist = r[0], r[1]
        images = sorted(p.images, key=lambda img: (not img.is_primary, img.sort_order))
        products.append(
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "description": p.description,
                "price": p.price,
                "price_unit": p.price_unit,
                "category_name": p.category.name if p.category else None,
                "primary_image": images[0].image_url if images else None,
                "business_name": p.biz_profile.business_name if p.biz_profile else None,
                "business_slug": p.biz_profile.slug if p.biz_profile else None,
                "is_verified": p.biz_profile.is_verified if p.biz_profile else False,
                "city": p.biz_profile.city if p.biz_profile else None,
                # A product has no location of its own; it inherits the business's.
                "latitude": p.biz_profile.latitude if p.biz_profile else None,
                "longitude": p.biz_profile.longitude if p.biz_profile else None,
                "distance_km": round(dist, 2),
            }
        )

    # ── Services (own coords, else the business's) ──────────────────────────
    # or_() prefers the service's own point and borrows the business's only when
    # the service has none, so no coordinates are ever invented.
    svc_ref = repo.ref_for("biz_services", BizService).or_(profile_ref)
    svc_dist = repo.distance_km(latitude, longitude, svc_ref).label("distance_km")
    svc_q = (
        select(BizService, svc_dist)
        .join(BizProfile, BizService.profile_id == BizProfile.id)
        .outerjoin(Category, BizService.category_id == Category.id)
        .options(
            joinedload(BizService.biz_profile),
            joinedload(BizService.category),
        )
        .where(
            BizService.status == ServiceStatus.ACTIVE.value,
            BizService.approval_status == ServiceApprovalStatus.APPROVED.value,
            BizService.is_available.is_(True),
            BizService.is_published.is_(True),
            BizProfile.is_public.is_(True),
            BizProfile.is_active.is_(True),
            # Needs a complete coordinate pair, from the service or the business.
            repo.has_location(svc_ref),
            repo.within_radius(latitude, longitude, svc_ref, radius_km),
        )
        .order_by(svc_dist)
        .limit(limit)
    )
    svc_rows = db.execute(svc_q).unique().all()
    services = []
    for r in svc_rows:
        s, dist = r[0], r[1]
        services.append(
            {
                "id": s.id,
                "source": "biz_service",
                "name": s.name,
                "slug": s.slug,
                "description": s.description,
                "image_url": s.image_url,
                "price": s.price_min,
                "price_unit": s.price_unit,
                "category_name": s.category.name if s.category else None,
                "provider_name": s.biz_profile.business_name if s.biz_profile else None,
                "provider_slug": s.biz_profile.slug if s.biz_profile else None,
                "city": s.city or (s.biz_profile.city if s.biz_profile else None),
                "is_verified": s.biz_profile.is_verified if s.biz_profile else False,
                "is_featured": s.is_featured,
                # Report the position the distance was actually measured from.
                # `or` would be wrong here: it treats a legitimate 0.0
                # coordinate as "missing" and falls back to the business.
                "latitude": _effective_lat(s, s.biz_profile),
                "longitude": _effective_lng(s, s.biz_profile),
                "distance_km": round(dist, 2),
            }
        )

    # ── Directory listings (optional extra service source) ──────────────────
    # A listing is located by its own coordinates when it has them, otherwise by
    # the business it belongs to. Requiring the listing's *own* latitude here is
    # what previously hid every listing from the marketplace.
    list_ref = repo.ref_for("service_listings", ServiceListing).or_(profile_ref)
    list_dist = repo.distance_km(latitude, longitude, list_ref).label("distance_km")
    list_q = (
        select(ServiceListing, list_dist)
        .outerjoin(
            BizProfile, ServiceListing.profile_id == BizProfile.id
        )
        .options(joinedload(ServiceListing.biz_profile))
        .where(
            ServiceListing.approval_status == ListingApprovalStatus.APPROVED.value,
            ServiceListing.is_active.is_(True),
            repo.has_location(list_ref),
            repo.within_radius(latitude, longitude, list_ref, radius_km),
        )
        .order_by(list_dist)
        .limit(limit)
    )
    list_rows = db.execute(list_q).unique().all()
    for r in list_rows:
        s, dist = r[0], r[1]
        services.append(
            {
                "id": s.id,
                "source": "service_listing",
                "name": s.name,
                "slug": s.slug,
                "description": s.description,
                "image_url": s.image_url,
                "price": s.price,
                "price_unit": s.price_unit,
                "category_name": None,
                "provider_name": s.provider_name,
                "provider_slug": None,
                "city": s.city,
                "is_verified": False,
                "is_featured": s.is_featured,
                "latitude": _effective_lat(s, s.biz_profile),
                "longitude": _effective_lng(s, s.biz_profile),
                "distance_km": round(dist, 2),
            }
        )
    services.sort(key=lambda x: x["distance_km"])

    return {
        "center": {"latitude": latitude, "longitude": longitude},
        "radius_km": radius_km,
        "products": {"items": products, "total": len(products)},
        "services": {"items": services, "total": len(services)},
        "businesses": {"items": businesses, "total": len(businesses)},
    }
