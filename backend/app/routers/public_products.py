"""Public products browsing router — best sellers and trending categories."""
import math

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.dependencies.database import get_db_session
from app.models.product import Product, ProductImage, ProductStatus
from app.models.biz_profile import BizProfile
from app.models.category import Category, Subcategory

router = APIRouter(prefix="/api/public/products", tags=["public-products"])


class ProductCategoryInfo(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class ProductImageInfo(BaseModel):
    id: int
    image_url: str
    sort_order: int
    is_primary: bool

    model_config = {"from_attributes": True}


class ProductCard(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    price: float | None
    price_unit: str | None
    is_available: bool
    profile_id: int | None = None
    category: ProductCategoryInfo | None = None
    business_name: str | None = None
    business_slug: str | None = None
    business_logo: str | None = None
    business_city: str | None = None
    is_verified: bool = False
    primary_image: str | None = None
    all_images: list[ProductImageInfo] = []
    created_at: str | None = None

    model_config = {"from_attributes": True}


class TrendingCategoryCard(BaseModel):
    """A trending category with one representative product for homepage display."""
    id: int
    name: str
    slug: str
    icon: str | None = None
    logo_url: str | None = None
    product_id: int
    product_name: str
    product_image: str | None = None
    product_price: float | None = None
    product_price_unit: str | None = None
    business_name: str | None = None
    business_phone: str | None = None
    business_slug: str | None = None
    is_verified: bool = False

    model_config = {"from_attributes": True}


def _serialize_product(prod: Product) -> dict:
    profile = prod.biz_profile
    images = sorted(prod.images, key=lambda img: (not img.is_primary, img.sort_order))
    primary = images[0].image_url if images else None
    return {
        "id": prod.id,
        "name": prod.name,
        "slug": prod.slug,
        "description": prod.description,
        "price": prod.price,
        "price_unit": prod.price_unit,
        "is_available": prod.is_available,
        "profile_id": prod.profile_id,
        "category": {
            "id": prod.category.id,
            "name": prod.category.name,
            "slug": prod.category.slug,
        }
        if prod.category
        else None,
        "business_name": profile.business_name if profile else None,
        "business_slug": profile.slug if profile else None,
        "business_logo": profile.logo_url if profile else None,
        "business_city": profile.city if profile else None,
        "is_verified": profile.is_verified if profile else False,
        "primary_image": primary,
        "all_images": [
            {
                "id": img.id,
                "image_url": img.image_url,
                "sort_order": img.sort_order,
                "is_primary": img.is_primary,
            }
            for img in images
        ],
        "created_at": prod.created_at.isoformat() if prod.created_at else None,
    }


@router.get("/trending-categories", response_model=list[TrendingCategoryCard])
def list_trending_categories(
    limit: int = Query(7, ge=1, le=12),
    db: Session = Depends(get_db_session),
):
    """Return trending categories with one representative active product each."""
    # Get trending categories ordered by trending_order
    cats = (
        db.execute(
            select(Category)
            .where(Category.is_trending == True, Category.is_active == True)
            .order_by(Category.trending_order.asc(), Category.name.asc())
            .limit(limit)
        )
        .scalars()
        .all()
    )

    result = []
    for cat in cats:
        # Find first active product in this category (best_seller first, then newest)
        prod = (
            db.execute(
                select(Product)
                .join(BizProfile, Product.profile_id == BizProfile.id)
                .options(
                    joinedload(Product.images),
                    joinedload(Product.biz_profile),
                )
                .where(
                    Product.category_id == cat.id,
                    Product.status == ProductStatus.ACTIVE.value,
                    Product.is_available == True,
                    BizProfile.is_active == True,
                    BizProfile.is_public == True,
                )
                .order_by(Product.is_best_seller.desc(), Product.created_at.desc())
                .limit(1)
            )
            .unique()
            .scalars()
            .first()
        )

        if not prod:
            continue  # skip categories with no available products

        profile = prod.biz_profile
        images = sorted(prod.images, key=lambda img: (not img.is_primary, img.sort_order))
        product_image = images[0].image_url if images else None

        result.append({
            "id": cat.id,
            "name": cat.name,
            "slug": cat.slug,
            "icon": cat.icon,
            "logo_url": cat.logo_url,
            "product_id": prod.id,
            "product_name": prod.name,
            "product_image": product_image,
            "product_price": prod.price,
            "product_price_unit": prod.price_unit,
            "business_name": profile.business_name if profile else None,
            "business_phone": profile.phone if profile else None,
            "business_slug": profile.slug if profile else None,
            "is_verified": profile.is_verified if profile else False,
        })

    return result


@router.get("/trending-categories/count")
def count_trending_categories(
    db: Session = Depends(get_db_session),
):
    q = (
        select(func.count(Category.id))
        .where(Category.is_trending == True, Category.is_active == True)
    )
    total = db.execute(q).scalar() or 0
    return {"total": total}


@router.get("/trending-products", response_model=list[ProductCard])
def list_trending_products(
    limit: int = Query(7, ge=1, le=12),
    db: Session = Depends(get_db_session),
):
    """Return trending products. Falls back to recent active products if none are trending."""
    q = (
        select(Product)
        .join(BizProfile, Product.profile_id == BizProfile.id)
        .outerjoin(Category, Product.category_id == Category.id)
        .options(
            joinedload(Product.biz_profile),
            joinedload(Product.category),
            joinedload(Product.subcategory),
            joinedload(Product.images),
        )
        .where(
            Product.is_trending == True,
            Product.status == ProductStatus.ACTIVE.value,
            Product.is_available == True,
            BizProfile.is_active == True,
            BizProfile.is_public == True,
        )
        .order_by(Product.trending_order.asc(), Product.created_at.desc())
        .limit(limit)
    )
    results = db.execute(q).unique().scalars().all()

    # Fallback: if no trending products, show recent active products
    if not results:
        q_fallback = (
            select(Product)
            .join(BizProfile, Product.profile_id == BizProfile.id)
            .outerjoin(Category, Product.category_id == Category.id)
            .options(
                joinedload(Product.biz_profile),
                joinedload(Product.category),
                joinedload(Product.subcategory),
                joinedload(Product.images),
            )
            .where(
                Product.status == ProductStatus.ACTIVE.value,
                Product.is_available == True,
                BizProfile.is_active == True,
                BizProfile.is_public == True,
            )
            .order_by(Product.created_at.desc())
            .limit(limit)
        )
        results = db.execute(q_fallback).unique().scalars().all()

    return [_serialize_product(p) for p in results]


@router.get("/trending-products/count")
def count_trending_products(
    db: Session = Depends(get_db_session),
):
    q = (
        select(func.count(Product.id))
        .join(BizProfile, Product.profile_id == BizProfile.id)
        .where(
            Product.is_trending == True,
            Product.status == ProductStatus.ACTIVE.value,
            Product.is_available == True,
            BizProfile.is_active == True,
            BizProfile.is_public == True,
        )
    )
    total = db.execute(q).scalar() or 0
    return {"total": total}


@router.get("/best-sellers", response_model=list[ProductCard])
def list_best_sellers(
    category_id: int | None = None,
    subcategory_id: int | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db_session),
):
    """Return approved best-seller products, ordered by best_seller_order."""
    q = (
        select(Product)
        .join(BizProfile, Product.profile_id == BizProfile.id)
        .outerjoin(Category, Product.category_id == Category.id)
        .options(
            joinedload(Product.biz_profile),
            joinedload(Product.category),
            joinedload(Product.subcategory),
            joinedload(Product.images),
        )
        .where(
            Product.is_best_seller == True,
            Product.status == ProductStatus.ACTIVE.value,
            Product.is_available == True,
            BizProfile.is_active == True,
            BizProfile.is_public == True,
        )
    )

    if category_id:
        q = q.where(Product.category_id == category_id)
    if subcategory_id:
        q = q.where(Product.subcategory_id == subcategory_id)

    q = q.order_by(Product.best_seller_order.asc(), Product.created_at.desc())

    offset = (page - 1) * page_size
    q = q.offset(offset).limit(page_size)

    results = db.execute(q).unique().scalars().all()
    return [_serialize_product(p) for p in results]


@router.get("/best-sellers/count")
def count_best_sellers(
    category_id: int | None = None,
    db: Session = Depends(get_db_session),
):
    q = (
        select(func.count(Product.id))
        .join(BizProfile, Product.profile_id == BizProfile.id)
        .where(
            Product.is_best_seller == True,
            Product.status == ProductStatus.ACTIVE.value,
            Product.is_available == True,
            BizProfile.is_active == True,
            BizProfile.is_public == True,
        )
    )
    if category_id:
        q = q.where(Product.category_id == category_id)
    total = db.execute(q).scalar() or 0
    return {"total": total}


@router.get("/list")
def list_products(
    category_id: int | None = Query(None),
    subcategory_id: int | None = Query(None),
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db_session),
):
    """Return active products filtered by category/subcategory, with pagination."""
    conditions = [
        Product.status == ProductStatus.ACTIVE.value,
        Product.is_available == True,
        BizProfile.is_active == True,
        BizProfile.is_public == True,
    ]
    if category_id:
        conditions.append(Product.category_id == category_id)
    if subcategory_id:
        conditions.append(Product.subcategory_id == subcategory_id)

    total = db.execute(
        select(func.count(Product.id))
        .join(BizProfile, Product.profile_id == BizProfile.id)
        .where(*conditions)
    ).scalar() or 0

    q_stmt = (
        select(Product)
        .join(BizProfile, Product.profile_id == BizProfile.id)
        .options(
            joinedload(Product.biz_profile),
            joinedload(Product.category),
            joinedload(Product.subcategory),
            joinedload(Product.images),
        )
        .where(*conditions)
        .order_by(Product.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    results = db.execute(q_stmt).unique().scalars().all()

    return {
        "items": [_serialize_product(p) for p in results],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total else 0,
    }


@router.get("/{product_id}", response_model=ProductCard)
def get_product_detail(
    product_id: int,
    db: Session = Depends(get_db_session),
):
    q = (
        select(Product)
        .join(BizProfile, Product.profile_id == BizProfile.id)
        .outerjoin(Category, Product.category_id == Category.id)
        .options(
            joinedload(Product.biz_profile),
            joinedload(Product.category),
            joinedload(Product.subcategory),
            joinedload(Product.images),
        )
        .where(
            Product.id == product_id,
            Product.status == ProductStatus.ACTIVE.value,
            BizProfile.is_active == True,
            BizProfile.is_public == True,
        )
    )
    result = db.execute(q).unique().scalars().first()
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return _serialize_product(result)
