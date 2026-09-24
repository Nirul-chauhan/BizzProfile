"""Seller API router — all endpoints under /api/seller/."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies.database import get_db_session
from app.dependencies.auth import require_enduser
from app.models.user import User
from app.services.seller import SellerService, SellerError
from app.schemas.seller import (
    SellerDashboardStats,
    SellerProfileCreate,
    SellerProfileUpdate,
    SellerProfileResponse,
    SellerProductCreate,
    SellerProductUpdate,
    SellerProductResponse,
    SellerProductImageResponse,
    SellerServiceCreate,
    SellerServiceUpdate,
    SellerServiceResponse,
    SellerBusinessHourCreate,
    SellerBusinessHourUpdate,
    SellerBusinessHourResponse,
    SellerEnquiryResponse,
    SellerEnquiryUpdateStatus,
    SellerQuotationCreate,
    SellerQuotationUpdate,
    SellerQuotationResponse,
    SellerRequirementResponse,
    SellerMessageCreate,
    SellerMessageResponse,
    SellerProfileSettingsUpdate,
    SellerProfileSettingsResponse,
)

router = APIRouter(prefix="/api/seller", tags=["seller"])


def _get_service(db: Session) -> SellerService:
    return SellerService(db)


def _handle_seller_error(e: SellerError, status_code: int = 400):
    msg = str(e)
    if "not own" in msg.lower() or "not a participant" in msg.lower():
        status_code = 403
    elif "not found" in msg.lower():
        status_code = 404
    raise HTTPException(status_code=status_code, detail=msg)


# ---------------------------------------------------------------------------
# 1. Dashboard Statistics
# ---------------------------------------------------------------------------

@router.get("/dashboard", response_model=SellerDashboardStats)
def get_dashboard(
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        stats = svc.get_dashboard_stats(current_user.id)
        return SellerDashboardStats(**stats)
    except SellerError as e:
        _handle_seller_error(e)


# ---------------------------------------------------------------------------
# 2-3. Business Profile
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=SellerProfileResponse)
def get_profile(
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        profile = svc.get_profile(current_user.id)
        return profile
    except SellerError as e:
        _handle_seller_error(e)


@router.post("/profile", response_model=SellerProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(
    data: SellerProfileCreate,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        profile = svc.create_profile(current_user.id, data.model_dump())
        return profile
    except SellerError as e:
        _handle_seller_error(e)


@router.put("/profile", response_model=SellerProfileResponse)
def update_profile(
    data: SellerProfileUpdate,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        profile = svc.update_profile(current_user.id, data.model_dump(exclude_unset=True))
        return profile
    except SellerError as e:
        _handle_seller_error(e)


# ---------------------------------------------------------------------------
# 4. Business Location (part of profile, separate endpoint for clarity)
# ---------------------------------------------------------------------------

@router.put("/profile/location", response_model=SellerProfileResponse)
def update_profile_location(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        profile = svc.update_profile(
            current_user.id,
            {"latitude": latitude, "longitude": longitude},
        )
        return profile
    except SellerError as e:
        _handle_seller_error(e)


# ---------------------------------------------------------------------------
# 5. Social Links (delegate to existing social_link service)
# ---------------------------------------------------------------------------

@router.get("/social-links")
def list_social_links(
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        profile = svc.get_profile(current_user.id)
    except SellerError as e:
        _handle_seller_error(e)

    from app.services.social_link import SocialLinkService
    sls = SocialLinkService(db)
    return sls.get_by_profile(profile.id)


@router.post("/social-links", status_code=status.HTTP_201_CREATED)
def create_social_link(
    platform: str,
    url: str,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        profile = svc.get_profile(current_user.id)
    except SellerError as e:
        _handle_seller_error(e)

    from app.services.social_link import SocialLinkService
    from app.models.social_link import SocialLinkPlatform
    sls = SocialLinkService(db)
    try:
        link = sls.create(
            profile_id=profile.id,
            platform=SocialLinkPlatform(platform),
            url=url,
            user_id=current_user.id,
            is_admin=False,
        )
        return link
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/social-links/{social_link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_social_link(
    social_link_id: int,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        profile = svc.get_profile(current_user.id)
    except SellerError as e:
        _handle_seller_error(e)

    from app.services.social_link import SocialLinkService
    sls = SocialLinkService(db)
    try:
        sls.delete(social_link_id, current_user.id, False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# 6. Documents/Verification (delegate to existing document service)
# ---------------------------------------------------------------------------

@router.get("/documents")
def list_documents(
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        profile = svc.get_profile(current_user.id)
    except SellerError as e:
        _handle_seller_error(e)

    from app.services.document import DocumentService
    from app.services.storage import LocalStorageService
    ds = DocumentService(db, LocalStorageService())
    return ds.get_by_profile(profile.id)


# ---------------------------------------------------------------------------
# 7-8. Products (CRUD)
# ---------------------------------------------------------------------------

@router.get("/products")
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.list_products(current_user.id, page, page_size)
    except SellerError as e:
        _handle_seller_error(e)


@router.post("/products", response_model=SellerProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: SellerProductCreate,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        product = svc.create_product(current_user.id, data.model_dump())
        return product
    except SellerError as e:
        _handle_seller_error(e)


@router.get("/products/{product_id}", response_model=SellerProductResponse)
def get_product(
    product_id: int,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.get_product(current_user.id, product_id)
    except SellerError as e:
        _handle_seller_error(e)


@router.put("/products/{product_id}", response_model=SellerProductResponse)
def update_product(
    product_id: int,
    data: SellerProductUpdate,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.update_product(current_user.id, product_id, data.model_dump(exclude_unset=True))
    except SellerError as e:
        _handle_seller_error(e)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        svc.delete_product(current_user.id, product_id)
    except SellerError as e:
        _handle_seller_error(e)


# ---------------------------------------------------------------------------
# 8a. Product Images
# ---------------------------------------------------------------------------

@router.get("/products/{product_id}/images")
def list_product_images(
    product_id: int,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.list_product_images(current_user.id, product_id)
    except SellerError as e:
        _handle_seller_error(e)


@router.post("/products/{product_id}/images", response_model=SellerProductImageResponse, status_code=status.HTTP_201_CREATED)
def add_product_image(
    product_id: int,
    image_url: str,
    sort_order: int = 0,
    is_primary: bool = False,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.add_product_image(current_user.id, product_id, image_url, sort_order, is_primary)
    except SellerError as e:
        _handle_seller_error(e)


@router.delete("/product-images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_image(
    image_id: int,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        svc.delete_product_image(current_user.id, image_id)
    except SellerError as e:
        _handle_seller_error(e)


# ---------------------------------------------------------------------------
# 9. Services (CRUD)
# ---------------------------------------------------------------------------

@router.get("/services")
def list_services(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.list_services(current_user.id, page, page_size)
    except SellerError as e:
        _handle_seller_error(e)


@router.post("/services", response_model=SellerServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    data: SellerServiceCreate,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.create_service(current_user.id, data.model_dump())
    except SellerError as e:
        _handle_seller_error(e)


@router.get("/services/{service_id}", response_model=SellerServiceResponse)
def get_service(
    service_id: int,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.get_service(current_user.id, service_id)
    except SellerError as e:
        _handle_seller_error(e)


@router.put("/services/{service_id}", response_model=SellerServiceResponse)
def update_service(
    service_id: int,
    data: SellerServiceUpdate,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.update_service(current_user.id, service_id, data.model_dump(exclude_unset=True))
    except SellerError as e:
        _handle_seller_error(e)


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        svc.delete_service(current_user.id, service_id)
    except SellerError as e:
        _handle_seller_error(e)


# ---------------------------------------------------------------------------
# 10. Enquiries
# ---------------------------------------------------------------------------

@router.get("/enquiries")
def list_enquiries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.list_enquiries(current_user.id, page, page_size, status_filter)
    except SellerError as e:
        _handle_seller_error(e)


@router.get("/enquiries/{enquiry_id}", response_model=SellerEnquiryResponse)
def get_enquiry(
    enquiry_id: int,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.get_enquiry(current_user.id, enquiry_id)
    except SellerError as e:
        _handle_seller_error(e)


@router.put("/enquiries/{enquiry_id}/status", response_model=SellerEnquiryResponse)
def update_enquiry_status(
    enquiry_id: int,
    data: SellerEnquiryUpdateStatus,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.update_enquiry_status(current_user.id, enquiry_id, data.status)
    except SellerError as e:
        _handle_seller_error(e)


# ---------------------------------------------------------------------------
# 11. Quotations
# ---------------------------------------------------------------------------

@router.post("/quotations", response_model=SellerQuotationResponse, status_code=status.HTTP_201_CREATED)
def create_quotation(
    data: SellerQuotationCreate,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.create_quotation(current_user.id, data.model_dump())
    except SellerError as e:
        _handle_seller_error(e)


@router.get("/quotations")
def list_quotations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.list_quotations(current_user.id, page, page_size, status_filter)
    except SellerError as e:
        _handle_seller_error(e)


@router.get("/quotations/{quotation_id}", response_model=SellerQuotationResponse)
def get_quotation(
    quotation_id: int,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.get_quotation(current_user.id, quotation_id)
    except SellerError as e:
        _handle_seller_error(e)


@router.put("/quotations/{quotation_id}", response_model=SellerQuotationResponse)
def update_quotation(
    quotation_id: int,
    data: SellerQuotationUpdate,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.update_quotation(current_user.id, quotation_id, data.model_dump(exclude_unset=True))
    except SellerError as e:
        _handle_seller_error(e)


# ---------------------------------------------------------------------------
# 12. Requirements (seller views public buyer requirements)
# ---------------------------------------------------------------------------

@router.get("/requirements")
def list_requirements(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: int | None = None,
    city: str | None = None,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.list_requirements(page, page_size, category_id, city)
    except SellerError as e:
        _handle_seller_error(e)


@router.get("/requirements/{requirement_id}", response_model=SellerRequirementResponse)
def get_requirement(
    requirement_id: int,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.get_requirement(requirement_id)
    except SellerError as e:
        _handle_seller_error(e)


# ---------------------------------------------------------------------------
# 13. Messages
# ---------------------------------------------------------------------------

@router.get("/messages/conversations")
def list_conversations(
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    return svc.list_conversations(current_user.id)


@router.get("/messages/{other_user_id}")
def get_messages(
    other_user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.get_messages(current_user.id, other_user_id, page, page_size)
    except SellerError as e:
        _handle_seller_error(e)


@router.post("/messages", response_model=SellerMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    data: SellerMessageCreate,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.send_message(current_user.id, data.receiver_id, data.content)
    except SellerError as e:
        _handle_seller_error(e)


@router.put("/messages/{other_user_id}/read")
def mark_messages_read(
    other_user_id: int,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    count = svc.mark_messages_read(current_user.id, other_user_id)
    return {"marked_read": count}


# ---------------------------------------------------------------------------
# 14. Profile Settings
# ---------------------------------------------------------------------------

@router.get("/settings", response_model=SellerProfileSettingsResponse)
def get_profile_settings(
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.get_profile_settings(current_user.id)
    except SellerError as e:
        _handle_seller_error(e)


@router.put("/settings", response_model=SellerProfileSettingsResponse)
def update_profile_settings(
    data: SellerProfileSettingsUpdate,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.update_profile_settings(current_user.id, data.model_dump(exclude_unset=True))
    except SellerError as e:
        _handle_seller_error(e)


# ---------------------------------------------------------------------------
# Business Hours (bonus — listed in features)
# ---------------------------------------------------------------------------

@router.get("/business-hours")
def list_business_hours(
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.list_business_hours(current_user.id)
    except SellerError as e:
        _handle_seller_error(e)


@router.post("/business-hours/{day_of_week}", response_model=SellerBusinessHourResponse, status_code=status.HTTP_201_CREATED)
def upsert_business_hours(
    day_of_week: int,
    data: SellerBusinessHourCreate,
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    svc = _get_service(db)
    try:
        return svc.upsert_business_hours(current_user.id, day_of_week, data.model_dump(exclude={"day_of_week"}))
    except SellerError as e:
        _handle_seller_error(e)


# ---------------------------------------------------------------------------
# Reviews — seller can view reviews for their profile
# ---------------------------------------------------------------------------

from pydantic import BaseModel
from app.models.review import Review, ReviewStatus
from app.models.biz_profile import BizProfile
from sqlalchemy import func


class SellerReviewResponse(BaseModel):
    id: int
    buyer_id: int
    buyer_name: str | None = None
    rating: int
    comment: str | None = None
    status: str
    created_at: str | None = None


@router.get("/reviews")
def list_seller_reviews(
    current_user: User = Depends(require_enduser),
    db: Session = Depends(get_db_session),
):
    profile = db.query(BizProfile).filter(BizProfile.user_id == current_user.id).first()
    if not profile:
        return {"items": [], "total": 0, "average_rating": 0}

    reviews = (
        db.query(Review)
        .filter(Review.profile_id == profile.id, Review.status == ReviewStatus.APPROVED.value)
        .order_by(Review.created_at.desc())
        .all()
    )

    avg_rating = 0
    if reviews:
        avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)

    items = []
    for r in reviews:
        buyer = db.query(User).filter(User.id == r.buyer_id).first()
        items.append({
            "id": r.id,
            "buyer_id": r.buyer_id,
            "buyer_name": buyer.full_name if buyer else None,
            "rating": r.rating,
            "comment": r.comment,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return {"items": items, "total": len(items), "average_rating": avg_rating}
