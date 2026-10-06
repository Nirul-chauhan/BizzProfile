import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.dependencies.database import get_db_session
from app.models.biz_profile import BizProfile
from app.models.category import Category, Subcategory
from app.models.product import Product, ProductStatus
from app.models.service import (
    BizService,
    ServiceApprovalStatus,
    ServiceStatus,
)
from app.models.service_listing import (
    ListingApprovalStatus,
    ServiceCategory,
    ServiceListing,
    ServiceSubcategory,
)
from app.repositories.search import SearchRepository
from app.schemas.search import SearchProfileItem, SearchResponse

router = APIRouter(tags=["search"])


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


@router.get("/api/search", response_model=SearchResponse)
def search_profiles(
    q: str | None = Query(None, max_length=200, description="Keyword search"),
    category_id: int | None = Query(None, description="Filter by category ID"),
    subcategory_id: int | None = Query(None, description="Filter by subcategory ID"),
    profile_type: str | None = Query(None, description="Filter by profile type"),
    city: str | None = Query(None, max_length=100, description="Filter by city"),
    state: str | None = Query(None, max_length=100, description="Filter by state"),
    country: str | None = Query(None, max_length=100, description="Filter by country"),
    pincode: str | None = Query(None, max_length=20, description="Filter by pincode"),
    latitude: float | None = Query(None, ge=-90, le=90, description="User latitude"),
    longitude: float | None = Query(None, ge=-180, le=180, description="User longitude"),
    radius_km: float | None = Query(None, gt=0, le=100, description="Search radius in km"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db_session),
):
    repo = SearchRepository(db)
    results, total = repo.search(
        q=q,
        category_id=category_id,
        subcategory_id=subcategory_id,
        profile_type=profile_type,
        city=city,
        state=state,
        country=country,
        pincode=pincode,
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
        data["category_name"] = result.category_name
        data["subcategory_name"] = result.subcategory_name
        items.append(SearchProfileItem.model_validate(data))

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return SearchResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        items=items,
    )


@router.get("/api/search/all")
def search_all(
    q: str | None = Query(None, max_length=200, description="Keyword search"),
    latitude: float | None = Query(None, ge=-90, le=90, description="User latitude"),
    longitude: float | None = Query(None, ge=-180, le=180, description="User longitude"),
    radius_km: float | None = Query(None, gt=0, le=100, description="Search radius in km"),
    limit: int = Query(12, ge=1, le=50, description="Max results per category"),
    db: Session = Depends(get_db_session),
):
    """Unified keyword search across every public surface on the marketplace."""
    keyword = (q or "").strip()
    pattern = f"%{keyword}%" if keyword else None
    has_geo = latitude is not None and longitude is not None

    # ── Businesses (profiles) ───────────────────────────────────────────────
    repo = SearchRepository(db)
    biz_results, biz_total = repo.search(
        q=keyword or None,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        page=1,
        page_size=limit,
    )
    businesses = []
    for result in biz_results:
        data = _serialize_profile(result.profile)
        data["distance_km"] = result.distance_km
        data["category_name"] = result.category_name
        data["subcategory_name"] = result.subcategory_name
        businesses.append(data)

    # ── Products ────────────────────────────────────────────────────────────
    # NOTE: Subcategory is joined explicitly. Referencing it only in the WHERE
    # clause would produce a cartesian product and inflate every count.
    product_q = (
        select(Product)
        .join(BizProfile, Product.profile_id == BizProfile.id)
        .outerjoin(Category, Product.category_id == Category.id)
        .outerjoin(Subcategory, Product.subcategory_id == Subcategory.id)
        .options(
            joinedload(Product.images),
            joinedload(Product.biz_profile),
            joinedload(Product.category),
        )
        .where(
            Product.status == ProductStatus.ACTIVE.value,
            Product.is_available.is_(True),
            BizProfile.is_active.is_(True),
            BizProfile.is_public.is_(True),
        )
    )
    if pattern:
        product_q = product_q.where(
            or_(
                Product.name.ilike(pattern),
                Product.description.ilike(pattern),
                Category.name.ilike(pattern),
                Subcategory.name.ilike(pattern),
            )
        )
    product_total = (
        db.execute(select(func.count()).select_from(product_q.subquery())).scalar() or 0
    )
    product_rows = (
        db.execute(product_q.order_by(Product.created_at.desc()).limit(limit))
        .unique()
        .scalars()
        .all()
    )

    def _serialize_product(p):
        images = sorted(p.images, key=lambda img: (not img.is_primary, img.sort_order))
        profile = p.biz_profile
        return {
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "description": p.description,
            "price": p.price,
            "price_unit": p.price_unit,
            "category_name": p.category.name if p.category else None,
            "primary_image": images[0].image_url if images else None,
            "business_name": profile.business_name if profile else None,
            "business_slug": profile.slug if profile else None,
            "is_verified": profile.is_verified if profile else False,
            "is_best_seller": p.is_best_seller,
        }

    products = [_serialize_product(p) for p in product_rows]

    # ── Best Sellers ────────────────────────────────────────────────────────
    # Curated products, ranked by the admin's explicit order. Falls back to the
    # top of the curated set so the group is never empty once curation starts.
    best_q = (
        select(Product)
        .join(BizProfile, Product.profile_id == BizProfile.id)
        .outerjoin(Category, Product.category_id == Category.id)
        .outerjoin(Subcategory, Product.subcategory_id == Subcategory.id)
        .options(
            joinedload(Product.images),
            joinedload(Product.biz_profile),
            joinedload(Product.category),
        )
        .where(
            Product.is_best_seller.is_(True),
            Product.status == ProductStatus.ACTIVE.value,
            Product.is_available.is_(True),
            BizProfile.is_active.is_(True),
            BizProfile.is_public.is_(True),
        )
    )
    if pattern:
        best_q = best_q.where(
            or_(
                Product.name.ilike(pattern),
                Product.description.ilike(pattern),
                Category.name.ilike(pattern),
                Subcategory.name.ilike(pattern),
            )
        )
    best_total = (
        db.execute(select(func.count()).select_from(best_q.subquery())).scalar() or 0
    )
    best_rows = (
        db.execute(
            best_q.order_by(
                Product.best_seller_order.asc(), Product.created_at.desc()
            ).limit(limit)
        )
        .unique()
        .scalars()
        .all()
    )
    best_sellers = [_serialize_product(p) for p in best_rows]

    # ── Services ────────────────────────────────────────────────────────────
    # Seller services (BizService) come first: those are the ones a visitor can
    # actually enquire about. Directory listings (ServiceListing) follow.
    biz_service_q = (
        select(BizService)
        .join(BizProfile, BizService.profile_id == BizProfile.id)
        .outerjoin(Category, BizService.category_id == Category.id)
        .outerjoin(Subcategory, BizService.subcategory_id == Subcategory.id)
        .options(
            joinedload(BizService.biz_profile),
            joinedload(BizService.category),
        )
        .where(
            BizService.status == ServiceStatus.ACTIVE.value,
            BizService.approval_status == ServiceApprovalStatus.APPROVED.value,
            BizService.is_available.is_(True),
            BizService.is_published.is_(True),
            BizProfile.is_active.is_(True),
            BizProfile.is_public.is_(True),
        )
    )
    if pattern:
        biz_service_q = biz_service_q.where(
            or_(
                BizService.name.ilike(pattern),
                BizService.description.ilike(pattern),
                Category.name.ilike(pattern),
                Subcategory.name.ilike(pattern),
            )
        )
    biz_service_total = (
        db.execute(
            select(func.count()).select_from(biz_service_q.subquery())
        ).scalar()
        or 0
    )
    biz_service_rows = (
        db.execute(
            biz_service_q.order_by(BizService.is_featured.desc(), BizService.sort_order)
            .limit(limit)
        )
        .unique()
        .scalars()
        .all()
    )
    services = [
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
            "city": s.city,
            "is_featured": s.is_featured,
        }
        for s in biz_service_rows
    ]

    listing_q = (
        select(ServiceListing)
        .outerjoin(ServiceCategory, ServiceListing.category_id == ServiceCategory.id)
        .outerjoin(
            ServiceSubcategory,
            ServiceListing.subcategory_id == ServiceSubcategory.id,
        )
        .options(
            joinedload(ServiceListing.category),
            joinedload(ServiceListing.subcategory),
        )
        .where(
            ServiceListing.approval_status == ListingApprovalStatus.APPROVED.value,
            ServiceListing.is_active.is_(True),
        )
    )
    if pattern:
        listing_q = listing_q.where(
            or_(
                ServiceListing.name.ilike(pattern),
                ServiceListing.description.ilike(pattern),
                ServiceCategory.name.ilike(pattern),
                ServiceSubcategory.name.ilike(pattern),
            )
        )
    listing_total = (
        db.execute(select(func.count()).select_from(listing_q.subquery())).scalar() or 0
    )
    listing_rows = (
        db.execute(
            listing_q.order_by(ServiceListing.created_at.desc()).limit(limit)
        )
        .unique()
        .scalars()
        .all()
    )
    for s in listing_rows:
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
                "category_name": s.category.name if s.category else None,
                "provider_name": s.provider_name,
                "provider_slug": None,
                "city": s.city,
                "is_featured": s.is_featured,
            }
        )
    service_total = biz_service_total + listing_total

    # ── Categories ──────────────────────────────────────────────────────────
    category_q = select(Category).where(Category.is_active.is_(True))
    if pattern:
        category_q = category_q.where(Category.name.ilike(pattern))
    category_total = (
        db.execute(select(func.count()).select_from(category_q.subquery())).scalar() or 0
    )
    category_rows = (
        db.execute(category_q.order_by(Category.sort_order, Category.name).limit(limit))
        .scalars()
        .all()
    )
    categories = [
        {
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "icon": c.icon,
            "logo_url": c.logo_url,
            "description": c.description,
        }
        for c in category_rows
    ]

    # ── Subcategories ───────────────────────────────────────────────────────
    subcategory_q = (
        select(Subcategory)
        .join(Category, Subcategory.category_id == Category.id)
        .options(joinedload(Subcategory.category))
        .where(Subcategory.is_active.is_(True), Category.is_active.is_(True))
    )
    if pattern:
        subcategory_q = subcategory_q.where(Subcategory.name.ilike(pattern))
    subcategory_total = (
        db.execute(
            select(func.count()).select_from(subcategory_q.subquery())
        ).scalar()
        or 0
    )
    subcategory_rows = (
        db.execute(subcategory_q.order_by(Subcategory.name).limit(limit))
        .unique()
        .scalars()
        .all()
    )
    subcategories = [
        {
            "id": s.id,
            "category_id": s.category_id,
            "name": s.name,
            "slug": s.slug,
            "category_name": s.category.name if s.category else None,
            "category_slug": s.category.slug if s.category else None,
        }
        for s in subcategory_rows
    ]

    # ── Nearby ──────────────────────────────────────────────────────────────
    # Needs coordinates. Without them the group is simply absent rather than
    # quietly falling back to "everything", which would be misleading.
    nearby = {"items": [], "total": 0}
    if has_geo:
        radius = radius_km or 10
        geo_repo = SearchRepository(db)
        geo_results, geo_total = geo_repo.search(
            q=keyword or None,
            latitude=latitude,
            longitude=longitude,
            radius_km=radius,
            page=1,
            page_size=limit,
        )
        near_items = []
        for result in geo_results:
            data = _serialize_profile(result.profile)
            data["distance_km"] = result.distance_km
            data["category_name"] = result.category_name
            near_items.append(data)
        nearby = {"items": near_items, "total": geo_total}

    return {
        "query": keyword,
        "products": {"items": products, "total": product_total},
        "services": {"items": services, "total": service_total},
        "businesses": {"items": businesses, "total": biz_total},
        "categories": {"items": categories, "total": category_total},
        "subcategories": {"items": subcategories, "total": subcategory_total},
        "best_sellers": {"items": best_sellers, "total": best_total},
        "nearby": nearby,
    }
