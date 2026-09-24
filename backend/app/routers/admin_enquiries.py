"""Admin Enquiries management router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.dependencies.database import get_db_session
from app.dependencies.auth import require_admin
from app.models.user import User
from app.models.enquiry import Enquiry, EnquiryStatus
from app.models.biz_profile import BizProfile
from app.models.product import Product
from app.models.service import BizService

router = APIRouter(prefix="/api/admin/enquiries", tags=["admin-enquiries"])


class EnquiryStatusUpdate(BaseModel):
    status: str


class AdminEnquiryResponse(BaseModel):
    id: int
    buyer_id: int
    buyer_name: str | None = None
    buyer_email: str | None = None
    profile_id: int
    business_name: str | None = None
    product_id: int | None = None
    product_name: str | None = None
    product_image: str | None = None
    service_id: int | None = None
    service_name: str | None = None
    message: str
    status: str
    created_at: str | None

    model_config = {"from_attributes": True}


@router.get("", response_model=list[AdminEnquiryResponse])
def list_enquiries(
    status: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    q = (
        select(Enquiry)
        .options(
            joinedload(Enquiry.buyer),
            joinedload(Enquiry.biz_profile),
            joinedload(Enquiry.product),
            joinedload(Enquiry.service),
        )
    )
    if status:
        q = q.where(Enquiry.status == status)
    if search:
        like = f"%{search}%"
        q = q.where(
            (Enquiry.message.ilike(like))
            | (Enquiry.buyer.has(User.full_name.ilike(like)))
            | (Enquiry.biz_profile.has(BizProfile.business_name.ilike(like)))
            | (Enquiry.product.has(Product.name.ilike(like)))
        )

    total = db.execute(select(func.count()).select_from(q.subquery())).scalar() or 0
    q = q.order_by(Enquiry.created_at.desc())
    q = q.offset((page - 1) * page_size).limit(page_size)
    results = db.execute(q).unique().scalars().all()

    out = []
    for e in results:
        buyer = e.buyer
        profile = e.biz_profile
        product = e.product
        service = e.service
        primary = None
        if product:
            images = sorted(
                product.images, key=lambda img: (not img.is_primary, img.sort_order)
            )
            if images:
                primary = images[0].image_url
        out.append(
            AdminEnquiryResponse(
                id=e.id,
                buyer_id=e.buyer_id,
                buyer_name=buyer.full_name if buyer else None,
                buyer_email=buyer.email if buyer else None,
                profile_id=e.profile_id,
                business_name=profile.business_name if profile else None,
                product_id=e.product_id,
                product_name=product.name if product else None,
                product_image=primary,
                service_id=e.service_id,
                service_name=service.name if service else None,
                message=e.message,
                status=e.status,
                created_at=e.created_at.isoformat() if e.created_at else None,
            )
        )
    return out


@router.get("/count")
def count_enquiries(
    status: str | None = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    q = select(func.count(Enquiry.id))
    if status:
        q = q.where(Enquiry.status == status)
    return {"total": db.execute(q).scalar() or 0}


@router.patch("/{enquiry_id}/status")
def update_enquiry_status(
    enquiry_id: int,
    data: EnquiryStatusUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    valid = {s.value for s in EnquiryStatus}
    if data.status not in valid:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of: {', '.join(sorted(valid))}",
        )
    enquiry = db.get(Enquiry, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    enquiry.status = data.status
    db.commit()
    db.refresh(enquiry)
    return {"id": enquiry.id, "status": enquiry.status}
