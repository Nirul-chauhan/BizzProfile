from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user, require_admin
from app.dependencies.database import get_db_session
from app.models.lead import Lead, LeadStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate

router = APIRouter(prefix="/api/leads", tags=["leads"])


@router.get("", response_model=list[LeadResponse])
def list_leads(
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    query = select(Lead)
    if current_user.role.name == "ADMIN":
        pass
    else:
        query = query.where(Lead.buyer_id == current_user.id)
    if status_filter:
        query = query.where(Lead.status == status_filter)
    query = query.order_by(Lead.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    leads = db.execute(query).scalars().all()
    return [LeadResponse.model_validate(l) for l in leads]


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    request: LeadCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    product = db.get(Product, request.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    lead = Lead(
        product_id=request.product_id,
        buyer_id=current_user.id,
        message=request.message,
        phone_to_call=request.phone_to_call,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return LeadResponse.model_validate(lead)


@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    request: LeadUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    lead.status = request.status
    if request.message is not None:
        lead.message = request.message
    db.commit()
    db.refresh(lead)
    return LeadResponse.model_validate(lead)
