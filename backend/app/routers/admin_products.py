"""Admin Products management router — product approval workflow."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db_session
from app.models.biz_profile import BizProfile
from app.models.category import Category, Subcategory
from app.models.product import Product, ProductStatus, ProductApprovalStatus
from app.models.user import User

router = APIRouter(prefix="/api/admin/products", tags=["admin-products"])


# ---------- Request schemas ----------


class ProductRejectRequest(BaseModel):
    rejection_reason: str


class ProductReviewRequest(BaseModel):
    action: str  # "approve" or "reject"
    rejection_reason: str | None = None


class ProductStatusUpdate(BaseModel):
    status: str

    def validated_status(self) -> str:
        allowed = {s.value for s in ProductStatus}
        if self.status not in allowed:
            raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return self.status


# ---------- Serializer ----------


def _serialize_product(prod: Product) -> dict:
    profile = prod.biz_profile
    cat = prod.category
    subcat = prod.subcategory
    images = sorted(prod.images, key=lambda i: (not i.is_primary, i.sort_order))
    return {
        "id": prod.id,
        "name": prod.name,
        "slug": prod.slug,
        "description": prod.description,
        "price": prod.price,
        "price_unit": prod.price_unit,
        "is_available": prod.is_available,
        "is_trending": prod.is_trending,
        "is_best_seller": prod.is_best_seller,
        "best_seller_order": prod.best_seller_order,
        "trending_order": prod.trending_order,
        "status": prod.status,
        "approval_status": prod.approval_status,
        "rejection_reason": prod.rejection_reason,
        "submitted_at": prod.submitted_at.isoformat() if prod.submitted_at else None,
        "reviewed_at": prod.reviewed_at.isoformat() if prod.reviewed_at else None,
        "reviewed_by_user_id": prod.reviewed_by_user_id,
        "added_by_user_id": prod.added_by_user_id,
        "category": (
            {"id": cat.id, "name": cat.name, "slug": cat.slug} if cat else None
        ),
        "subcategory": (
            {"id": subcat.id, "name": subcat.name, "slug": subcat.slug} if subcat else None
        ),
        "business": (
            {
                "id": profile.id,
                "business_name": profile.business_name,
                "slug": profile.slug,
                "logo_url": profile.logo_url,
                "city": profile.city,
                "user_id": profile.user_id,
            }
            if profile
            else None
        ),
        "primary_image": images[0].image_url if images else None,
        "image_count": len(images),
        "created_at": prod.created_at.isoformat() if prod.created_at else None,
        "updated_at": prod.updated_at.isoformat() if prod.updated_at else None,
    }


# ---------- Query helpers ----------


def _base_query():
    return (
        select(Product)
        .join(BizProfile, Product.profile_id == BizProfile.id)
        .outerjoin(Category, Product.category_id == Category.id)
        .outerjoin(Subcategory, Product.subcategory_id == Subcategory.id)
        .options(
            joinedload(Product.biz_profile),
            joinedload(Product.category),
            joinedload(Product.subcategory),
            joinedload(Product.images),
        )
    )


def _apply_filters(
    q,
    search: str | None = None,
    category_id: int | None = None,
    approval_status: str | None = None,
    status: str | None = None,
    business_id: int | None = None,
):
    if search:
        q = q.where(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
                BizProfile.business_name.ilike(f"%{search}%"),
            )
        )
    if category_id:
        q = q.where(Product.category_id == category_id)
    if approval_status:
        q = q.where(Product.approval_status == approval_status)
    if status:
        q = q.where(Product.status == status)
    if business_id:
        q = q.where(Product.profile_id == business_id)
    return q


# ---------- Endpoints ----------


@router.get("")
def list_products(
    search: str | None = None,
    category_id: int | None = None,
    approval_status: ProductApprovalStatus | None = Query(None),
    status: ProductStatus | None = Query(None),
    business_id: int | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    q = _base_query()
    q = _apply_filters(
        q,
        search,
        category_id,
        approval_status.value if approval_status else None,
        status.value if status else None,
        business_id,
    )
    q = q.order_by(Product.created_at.desc())
    q = q.offset((page - 1) * page_size).limit(page_size)

    results = db.execute(q).unique().scalars().all()
    return [_serialize_product(p) for p in results]


@router.get("/count")
def count_products(
    search: str | None = None,
    category_id: int | None = None,
    approval_status: ProductApprovalStatus | None = Query(None),
    status: ProductStatus | None = Query(None),
    business_id: int | None = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    q = select(func.count(Product.id)).join(
        BizProfile, Product.profile_id == BizProfile.id
    )
    q = _apply_filters(
        q,
        search,
        category_id,
        approval_status.value if approval_status else None,
        status.value if status else None,
        business_id,
    )
    return {"total": db.execute(q).scalar() or 0}


@router.get("/requests")
def list_pending_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    """Products waiting on an admin decision."""
    q = (
        _base_query()
        .where(Product.approval_status == ProductApprovalStatus.PENDING.value)
        .order_by(Product.submitted_at.desc().nullslast(), Product.created_at.desc())
    )
    q = q.offset((page - 1) * page_size).limit(page_size)

    results = db.execute(q).unique().scalars().all()
    return [_serialize_product(p) for p in results]


@router.get("/requests/count")
def count_pending_requests(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    total = (
        db.execute(
            select(func.count(Product.id)).where(
                Product.approval_status == ProductApprovalStatus.PENDING.value
            )
        ).scalar()
        or 0
    )
    return {"total": total}


@router.get("/{product_id}")
def get_product_detail(
    product_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    prod = db.execute(_base_query().where(Product.id == product_id)).unique().scalars().first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return _serialize_product(prod)


@router.patch("/{product_id}/approve")
def approve_product(
    product_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    """Approve a product and publish it to the public marketplace."""
    prod = db.get(Product, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    prod.approval_status = ProductApprovalStatus.APPROVED.value
    prod.rejection_reason = None
    prod.status = ProductStatus.ACTIVE.value
    prod.reviewed_at = datetime.now(timezone.utc)
    prod.reviewed_by_user_id = current_user.id
    db.commit()
    db.refresh(prod)
    return _serialize_product(prod)


@router.patch("/{product_id}/reject")
def reject_product(
    product_id: int,
    data: ProductRejectRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    prod = db.get(Product, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    prod.approval_status = ProductApprovalStatus.REJECTED.value
    prod.rejection_reason = data.rejection_reason
    prod.status = ProductStatus.DRAFT.value
    prod.reviewed_at = datetime.now(timezone.utc)
    prod.reviewed_by_user_id = current_user.id
    db.commit()
    db.refresh(prod)
    return _serialize_product(prod)


@router.patch("/{product_id}/review")
def review_product(
    product_id: int,
    data: ProductReviewRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    if data.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")

    prod = db.get(Product, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    if data.action == "approve":
        prod.approval_status = ProductApprovalStatus.APPROVED.value
        prod.rejection_reason = None
        prod.status = ProductStatus.ACTIVE.value
    else:
        prod.approval_status = ProductApprovalStatus.REJECTED.value
        prod.rejection_reason = data.rejection_reason
        prod.status = ProductStatus.DRAFT.value

    prod.reviewed_at = datetime.now(timezone.utc)
    prod.reviewed_by_user_id = current_user.id
    db.commit()
    db.refresh(prod)
    return _serialize_product(prod)


@router.patch("/{product_id}/status")
def update_product_status(
    product_id: int,
    data: ProductStatusUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    try:
        new_status = data.validated_status()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    prod = db.get(Product, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    # Only an approved product may be live on the marketplace.
    if new_status == ProductStatus.ACTIVE.value:
        if prod.approval_status != ProductApprovalStatus.APPROVED.value:
            raise HTTPException(
                status_code=400, detail="Approve the product before activating it."
            )
    prod.status = new_status
    db.commit()
    db.refresh(prod)
    return _serialize_product(prod)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    hard: bool = Query(False),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    prod = db.get(Product, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    if hard:
        db.delete(prod)
    else:
        prod.status = ProductStatus.INACTIVE.value
    db.commit()
    return {"id": product_id, "deleted": hard}
