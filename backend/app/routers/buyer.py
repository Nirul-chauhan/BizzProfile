"""Buyer API router — all endpoints under /api/buyer/."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.dependencies.database import get_db_session
from app.dependencies.auth import require_customer
from app.models.user import User
from app.models.product import Product, ProductStatus
from app.models.biz_profile import BizProfile
from app.models.best_seller_request import BestSellerRequest, BestSellerRequestStatus
from app.models.trending_product_request import TrendingProductRequest, TrendingProductRequestStatus
from app.services.buyer import BuyerService, BuyerError
from app.schemas.buyer import (
    BuyerDashboardStats,
    BuyerProfileResponse,
    BuyerProfileUpdate,
    BuyerRequirementCreate,
    BuyerRequirementUpdate,
    BuyerRequirementResponse,
    BuyerEnquiryCreate,
    BuyerEnquiryResponse,
    BuyerFavoriteCreate,
    BuyerFavoriteResponse,
    BuyerQuotationResponse,
    BuyerMessageCreate,
    BuyerMessageResponse,
)

router = APIRouter(prefix="/api/buyer", tags=["buyer"])


def _get_service(db: Session) -> BuyerService:
    return BuyerService(db)


def _handle_buyer_error(e: BuyerError, status_code: int = 400):
    msg = str(e)
    if "not own" in msg.lower() or "not a participant" in msg.lower():
        status_code = 403
    elif "not found" in msg.lower():
        status_code = 404
    raise HTTPException(status_code=status_code, detail=msg)


# ---------------------------------------------------------------------------
# 1. Dashboard Statistics
# ---------------------------------------------------------------------------

@router.get("/dashboard", response_model=BuyerDashboardStats)
def get_dashboard(
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        stats = svc.get_dashboard_stats(current_user.id)
        return BuyerDashboardStats(**stats)
    except BuyerError as e:
        _handle_buyer_error(e)


# ---------------------------------------------------------------------------
# 2. Profile
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=BuyerProfileResponse)
def get_profile(
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.get_profile(current_user.id)
    except BuyerError as e:
        _handle_buyer_error(e)


@router.put("/profile", response_model=BuyerProfileResponse)
def update_profile(
    data: BuyerProfileUpdate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    update_data = data.model_dump(exclude_unset=True)
    society_name = update_data.pop("society", None)
    if society_name is not None:
        from app.models.society import Society
        if society_name.strip():
            soc = db.execute(select(Society).where(Society.name == society_name.strip())).scalars().first()
            if not soc:
                soc = Society(name=society_name.strip())
                db.add(soc)
                db.flush()
            update_data["society_id"] = soc.id
        else:
            update_data["society_id"] = None
    try:
        return svc.update_profile(current_user.id, update_data)
    except BuyerError as e:
        _handle_buyer_error(e)


# ---------------------------------------------------------------------------
# 3. Requirements
# ---------------------------------------------------------------------------

@router.post("/requirements", response_model=BuyerRequirementResponse, status_code=status.HTTP_201_CREATED)
def create_requirement(
    data: BuyerRequirementCreate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.create_requirement(current_user.id, data.model_dump())
    except BuyerError as e:
        _handle_buyer_error(e)


@router.get("/requirements")
def list_requirements(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.list_requirements(current_user.id, page, page_size)
    except BuyerError as e:
        _handle_buyer_error(e)


@router.get("/requirements/{requirement_id}", response_model=BuyerRequirementResponse)
def get_requirement(
    requirement_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.get_requirement(current_user.id, requirement_id)
    except BuyerError as e:
        _handle_buyer_error(e)


@router.put("/requirements/{requirement_id}", response_model=BuyerRequirementResponse)
def update_requirement(
    requirement_id: int,
    data: BuyerRequirementUpdate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.update_requirement(current_user.id, requirement_id, data.model_dump(exclude_unset=True))
    except BuyerError as e:
        _handle_buyer_error(e)


@router.delete("/requirements/{requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_requirement(
    requirement_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        svc.delete_requirement(current_user.id, requirement_id)
    except BuyerError as e:
        _handle_buyer_error(e)


# ---------------------------------------------------------------------------
# 4. Enquiries
# ---------------------------------------------------------------------------

@router.post("/enquiries", response_model=BuyerEnquiryResponse, status_code=status.HTTP_201_CREATED)
def create_enquiry(
    data: BuyerEnquiryCreate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.create_enquiry(current_user.id, data.model_dump())
    except BuyerError as e:
        _handle_buyer_error(e)


@router.get("/enquiries")
def list_enquiries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.list_enquiries(current_user.id, page, page_size)
    except BuyerError as e:
        _handle_buyer_error(e)


@router.get("/enquiries/{enquiry_id}", response_model=BuyerEnquiryResponse)
def get_enquiry(
    enquiry_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.get_enquiry(current_user.id, enquiry_id)
    except BuyerError as e:
        _handle_buyer_error(e)


# ---------------------------------------------------------------------------
# 5. Favorites
# ---------------------------------------------------------------------------

@router.post("/favorites", response_model=BuyerFavoriteResponse, status_code=status.HTTP_201_CREATED)
def add_favorite(
    data: BuyerFavoriteCreate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.add_favorite(current_user.id, data.target_type, data.target_id)
    except BuyerError as e:
        _handle_buyer_error(e)


@router.get("/favorites")
def list_favorites(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.list_favorites(current_user.id, page, page_size)
    except BuyerError as e:
        _handle_buyer_error(e)


@router.delete("/favorites/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    favorite_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        svc.remove_favorite(current_user.id, favorite_id)
    except BuyerError as e:
        _handle_buyer_error(e)


# ---------------------------------------------------------------------------
# 6. Quotations
# ---------------------------------------------------------------------------

@router.get("/quotations")
def list_quotations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.list_quotations(current_user.id, page, page_size)
    except BuyerError as e:
        _handle_buyer_error(e)


@router.get("/quotations/{quotation_id}", response_model=BuyerQuotationResponse)
def get_quotation(
    quotation_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.get_quotation(current_user.id, quotation_id)
    except BuyerError as e:
        _handle_buyer_error(e)


@router.patch("/quotations/{quotation_id}/accept", response_model=BuyerQuotationResponse)
def accept_quotation(
    quotation_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.accept_quotation(current_user.id, quotation_id)
    except BuyerError as e:
        _handle_buyer_error(e)


@router.patch("/quotations/{quotation_id}/reject", response_model=BuyerQuotationResponse)
def reject_quotation(
    quotation_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.reject_quotation(current_user.id, quotation_id)
    except BuyerError as e:
        _handle_buyer_error(e)


# ---------------------------------------------------------------------------
# 7. Messages
# ---------------------------------------------------------------------------

@router.get("/messages/conversations")
def list_conversations(
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    return svc.list_conversations(current_user.id)


@router.get("/messages/{other_user_id}")
def get_messages(
    other_user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.get_messages(current_user.id, other_user_id, page, page_size)
    except BuyerError as e:
        _handle_buyer_error(e)


@router.post("/messages", response_model=BuyerMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    data: BuyerMessageCreate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.send_message(current_user.id, data.receiver_id, data.content)
    except BuyerError as e:
        _handle_buyer_error(e)


@router.put("/messages/{other_user_id}/read")
def mark_messages_read(
    other_user_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    count = svc.mark_messages_read(current_user.id, other_user_id)
    return {"marked_read": count}


# ---------------------------------------------------------------------------
# 9. Best Seller Requests
# ---------------------------------------------------------------------------

class BestSellerRequestCreate(BaseModel):
    product_id: int
    message: str | None = None


class BestSellerRequestResponse(BaseModel):
    id: int
    product_id: int
    product_name: str | None = None
    product_image: str | None = None
    business_name: str | None = None
    message: str | None
    status: str
    admin_note: str | None
    created_at: str | None

    model_config = {"from_attributes": True}


@router.post("/best-seller-requests", status_code=status.HTTP_201_CREATED)
def create_best_seller_request(
    data: BestSellerRequestCreate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    product = db.get(Product, data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.status != ProductStatus.ACTIVE.value:
        raise HTTPException(status_code=400, detail="Product is not active")

    profile = db.get(BizProfile, product.profile_id)
    if not profile or not profile.is_active:
        raise HTTPException(status_code=400, detail="Business profile is not active")

    existing = db.execute(
        select(BestSellerRequest).where(
            BestSellerRequest.buyer_id == current_user.id,
            BestSellerRequest.product_id == data.product_id,
            BestSellerRequest.status.in_([
                BestSellerRequestStatus.PENDING.value,
                BestSellerRequestStatus.APPROVED.value,
            ]),
        )
    ).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending or approved request for this product")

    req = BestSellerRequest(
        buyer_id=current_user.id,
        product_id=data.product_id,
        message=data.message,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    images = sorted(product.images, key=lambda img: (not img.is_primary, img.sort_order))
    return {
        "id": req.id,
        "product_id": req.product_id,
        "product_name": product.name,
        "product_image": images[0].image_url if images else None,
        "business_name": profile.business_name if profile else None,
        "message": req.message,
        "status": req.status,
        "admin_note": req.admin_note,
        "created_at": req.created_at.isoformat() if req.created_at else None,
    }


@router.get("/best-seller-requests")
def list_best_seller_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    q = (
        select(BestSellerRequest)
        .where(BestSellerRequest.buyer_id == current_user.id)
        .options(
            joinedload(BestSellerRequest.product),
        )
        .order_by(BestSellerRequest.created_at.desc())
    )
    offset = (page - 1) * page_size
    q = q.offset(offset).limit(page_size)
    results = db.execute(q).unique().scalars().all()

    out = []
    for r in results:
        prod = r.product
        profile = prod.biz_profile if prod else None
        images = sorted(prod.images, key=lambda img: (not img.is_primary, img.sort_order)) if prod else []
        out.append({
            "id": r.id,
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


# ---------------------------------------------------------------------------
# Trending Product Requests
# ---------------------------------------------------------------------------

class TrendingProductRequestCreate(BaseModel):
    product_id: int
    message: str | None = None


class TrendingProductRequestResponse(BaseModel):
    id: int
    product_id: int
    product_name: str | None = None
    product_image: str | None = None
    business_name: str | None = None
    message: str | None
    status: str
    admin_note: str | None
    created_at: str | None

    model_config = {"from_attributes": True}


@router.post("/trending-product-requests", status_code=status.HTTP_201_CREATED)
def create_trending_product_request(
    data: TrendingProductRequestCreate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    product = db.get(Product, data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.status != ProductStatus.ACTIVE.value:
        raise HTTPException(status_code=400, detail="Product is not active")

    profile = db.get(BizProfile, product.profile_id)
    if not profile or not profile.is_active:
        raise HTTPException(status_code=400, detail="Business profile is not active")

    existing = db.execute(
        select(TrendingProductRequest).where(
            TrendingProductRequest.buyer_id == current_user.id,
            TrendingProductRequest.product_id == data.product_id,
            TrendingProductRequest.status.in_([
                TrendingProductRequestStatus.PENDING.value,
                TrendingProductRequestStatus.APPROVED.value,
            ]),
        )
    ).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending or approved request for this product")

    req = TrendingProductRequest(
        buyer_id=current_user.id,
        product_id=data.product_id,
        message=data.message,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    images = sorted(product.images, key=lambda img: (not img.is_primary, img.sort_order))
    return {
        "id": req.id,
        "product_id": req.product_id,
        "product_name": product.name,
        "product_image": images[0].image_url if images else None,
        "business_name": profile.business_name if profile else None,
        "message": req.message,
        "status": req.status,
        "admin_note": req.admin_note,
        "created_at": req.created_at.isoformat() if req.created_at else None,
    }


@router.get("/trending-product-requests")
def list_trending_product_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db_session),
):
    q = (
        select(TrendingProductRequest)
        .where(TrendingProductRequest.buyer_id == current_user.id)
        .options(
            joinedload(TrendingProductRequest.product),
        )
        .order_by(TrendingProductRequest.created_at.desc())
    )
    offset = (page - 1) * page_size
    q = q.offset(offset).limit(page_size)
    results = db.execute(q).unique().scalars().all()

    out = []
    for r in results:
        prod = r.product
        profile = prod.biz_profile if prod else None
        images = sorted(prod.images, key=lambda img: (not img.is_primary, img.sort_order)) if prod else []
        out.append({
            "id": r.id,
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
