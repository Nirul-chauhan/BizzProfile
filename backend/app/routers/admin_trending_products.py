"""Admin Trending Products management router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.dependencies.database import get_db_session
from app.dependencies.auth import require_admin
from app.models.user import User
from app.models.product import Product, ProductImage, ProductStatus
from app.models.biz_profile import BizProfile
from app.models.category import Category
from app.models.trending_product_request import TrendingProductRequest, TrendingProductRequestStatus

router = APIRouter(prefix="/api/admin/trending-products", tags=["admin-trending-products"])


class TrendingToggleRequest(BaseModel):
    is_trending: bool


class TrendingOrderUpdate(BaseModel):
    trending_order: int


class TrendingRequestAction(BaseModel):
    status: str  # APPROVED or REJECTED
    admin_note: str | None = None


class TrendingRequestResponse(BaseModel):
    id: int
    buyer_id: int
    buyer_name: str | None = None
    product_id: int
    product_name: str | None = None
    product_image: str | None = None
    business_name: str | None = None
    message: str | None
    status: str
    admin_note: str | None
    created_at: str | None

    model_config = {"from_attributes": True}


class AdminTrendingProductCard(BaseModel):
    id: int
    name: str
    slug: str
    price: float | None
    price_unit: str | None
    is_trending: bool
    trending_order: int
    status: str
    is_available: bool
    category_name: str | None = None
    business_name: str | None = None
    business_slug: str | None = None
    is_verified: bool = False
    primary_image: str | None = None
    created_at: str | None

    model_config = {"from_attributes": True}


def _serialize_admin_product(prod: Product) -> dict:
    profile = prod.biz_profile
    images = sorted(prod.images, key=lambda img: (not img.is_primary, img.sort_order))
    primary = images[0].image_url if images else None
    return {
        "id": prod.id,
        "name": prod.name,
        "slug": prod.slug,
        "price": prod.price,
        "price_unit": prod.price_unit,
        "is_trending": prod.is_trending,
        "trending_order": prod.trending_order,
        "status": prod.status,
        "is_available": prod.is_available,
        "category_name": prod.category.name if prod.category else None,
        "business_name": profile.business_name if profile else None,
        "business_slug": profile.slug if profile else None,
        "is_verified": profile.is_verified if profile else False,
        "primary_image": primary,
        "created_at": prod.created_at.isoformat() if prod.created_at else None,
    }


@router.get("", response_model=list[AdminTrendingProductCard])
def list_all_products(
    search: str | None = None,
    category_id: int | None = None,
    is_trending: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    q = (
        select(Product)
        .join(BizProfile, Product.profile_id == BizProfile.id)
        .outerjoin(Category, Product.category_id == Category.id)
        .options(
            joinedload(Product.biz_profile),
            joinedload(Product.category),
            joinedload(Product.images),
        )
        .where(Product.status != ProductStatus.DRAFT.value)
    )

    if search:
        q = q.where(Product.name.ilike(f"%{search}%"))
    if category_id:
        q = q.where(Product.category_id == category_id)
    if is_trending is not None:
        q = q.where(Product.is_trending == is_trending)

    q = q.order_by(Product.trending_order.asc(), Product.created_at.desc())

    offset = (page - 1) * page_size
    q = q.offset(offset).limit(page_size)

    results = db.execute(q).unique().scalars().all()
    return [_serialize_admin_product(p) for p in results]


@router.get("/count")
def count_products(
    search: str | None = None,
    category_id: int | None = None,
    is_trending: bool | None = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    q = select(func.count(Product.id)).where(Product.status != ProductStatus.DRAFT.value)
    if search:
        q = q.where(Product.name.ilike(f"%{search}%"))
    if category_id:
        q = q.where(Product.category_id == category_id)
    if is_trending is not None:
        q = q.where(Product.is_trending == is_trending)
    total = db.execute(q).scalar() or 0
    return {"total": total}


@router.patch("/{product_id}/toggle")
def toggle_trending(
    product_id: int,
    data: TrendingToggleRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_trending = data.is_trending
    if not data.is_trending:
        product.trending_order = 0
    db.commit()
    db.refresh(product)
    return {"id": product.id, "is_trending": product.is_trending, "trending_order": product.trending_order}


@router.patch("/{product_id}/order")
def update_trending_order(
    product_id: int,
    data: TrendingOrderUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product.is_trending:
        raise HTTPException(status_code=400, detail="Product is not trending")
    product.trending_order = data.trending_order
    db.commit()
    db.refresh(product)
    return {"id": product.id, "trending_order": product.trending_order}


# --- Trending Product Requests ---

@router.get("/requests", response_model=list[TrendingRequestResponse])
def list_trending_requests(
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    q = (
        select(TrendingProductRequest)
        .options(
            joinedload(TrendingProductRequest.buyer),
            joinedload(TrendingProductRequest.product),
        )
    )
    if status:
        q = q.where(TrendingProductRequest.status == status)
    q = q.order_by(TrendingProductRequest.created_at.desc())

    offset = (page - 1) * page_size
    q = q.offset(offset).limit(page_size)

    results = db.execute(q).unique().scalars().all()
    out = []
    for r in results:
        prod = r.product
        buyer = r.buyer
        profile = prod.biz_profile if prod else None
        images = sorted(prod.images, key=lambda img: (not img.is_primary, img.sort_order)) if prod else []
        out.append({
            "id": r.id,
            "buyer_id": r.buyer_id,
            "buyer_name": buyer.full_name if buyer else None,
            "product_id": r.product_id,
            "product_name": prod.name if prod else None,
            "product_image": images[0].image_url if images else None,
            "business_name": profile.business_name if profile else None,
            "message": r.message,
            "status": r.status,
            "admin_note": r.admin_note,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return out


@router.patch("/requests/{request_id}")
def review_trending_request(
    request_id: int,
    data: TrendingRequestAction,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    req = db.get(TrendingProductRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    allowed = {TrendingProductRequestStatus.APPROVED.value, TrendingProductRequestStatus.REJECTED.value}
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(sorted(allowed))}")

    req.status = data.status
    req.admin_note = data.admin_note

    if data.status == TrendingProductRequestStatus.APPROVED.value:
        product = db.get(Product, req.product_id)
        if product:
            product.is_trending = True

    db.commit()
    db.refresh(req)
    return {"id": req.id, "status": req.status, "admin_note": req.admin_note}
