"""Admin Services management router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.dependencies.database import get_db_session
from app.dependencies.auth import require_admin
from app.models.user import User
from app.models.service import BizService, ServiceStatus, ServiceApprovalStatus
from app.models.category import Category, Subcategory
from app.models.biz_profile import BizProfile

router = APIRouter(prefix="/api/admin/services", tags=["admin-services"])


# ---------- Request / Response schemas ----------


class RejectRequest(BaseModel):
    rejection_reason: str


class SortOrderUpdate(BaseModel):
    sort_order: int


class ServiceActionRequest(BaseModel):
    action: str  # "approve" or "reject"
    rejection_reason: str | None = None


# ---------- Serializer ----------


def _serialize_service(svc: BizService) -> dict:
    profile = svc.biz_profile
    cat = svc.category
    subcat = svc.subcategory
    return {
        "id": svc.id,
        "name": svc.name,
        "slug": svc.slug,
        "description": svc.description,
        "image_url": svc.image_url,
        "price_min": svc.price_min,
        "price_max": svc.price_max,
        "price_unit": svc.price_unit,
        "is_trending": svc.is_trending,
        "is_featured": svc.is_featured,
        "is_published": svc.is_published,
        "approval_status": svc.approval_status,
        "rejection_reason": svc.rejection_reason,
        "status": svc.status,
        "category": {
            "id": cat.id,
            "name": cat.name,
            "slug": cat.slug,
        }
        if cat
        else None,
        "subcategory": {
            "id": subcat.id,
            "name": subcat.name,
            "slug": subcat.slug,
        }
        if subcat
        else None,
        "business": {
            "id": profile.id,
            "business_name": profile.business_name,
            "slug": profile.slug,
            "logo_url": profile.logo_url,
            "city": profile.city,
        }
        if profile
        else None,
        "added_by_user_id": svc.added_by_user_id,
        "created_at": svc.created_at.isoformat() if svc.created_at else None,
        "updated_at": svc.updated_at.isoformat() if svc.updated_at else None,
    }


# ---------- Helper: base query with eager loads ----------


def _base_query():
    return (
        select(BizService)
        .join(BizProfile, BizService.profile_id == BizProfile.id)
        .outerjoin(Category, BizService.category_id == Category.id)
        .outerjoin(Subcategory, BizService.subcategory_id == Subcategory.id)
        .options(
            joinedload(BizService.biz_profile),
            joinedload(BizService.category),
            joinedload(BizService.subcategory),
        )
    )


def _apply_filters(
    q,
    search: str | None = None,
    category_id: int | None = None,
    approval_status: str | None = None,
    is_trending: bool | None = None,
    is_featured: bool | None = None,
):
    if search:
        q = q.where(BizService.name.ilike(f"%{search}%"))
    if category_id:
        q = q.where(BizService.category_id == category_id)
    if approval_status:
        q = q.where(BizService.approval_status == approval_status)
    if is_trending is not None:
        q = q.where(BizService.is_trending == is_trending)
    if is_featured is not None:
        q = q.where(BizService.is_featured == is_featured)
    return q


# ---------- Endpoints ----------


@router.get("")
def list_services(
    search: str | None = None,
    category_id: int | None = None,
    approval_status: str | None = None,
    is_trending: bool | None = None,
    is_featured: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    q = _base_query()
    q = _apply_filters(q, search, category_id, approval_status, is_trending, is_featured)
    q = q.order_by(BizService.created_at.desc())

    offset = (page - 1) * page_size
    q = q.offset(offset).limit(page_size)

    results = db.execute(q).unique().scalars().all()
    return [_serialize_service(s) for s in results]


@router.get("/count")
def count_services(
    search: str | None = None,
    category_id: int | None = None,
    approval_status: str | None = None,
    is_trending: bool | None = None,
    is_featured: bool | None = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    q = select(func.count(BizService.id))
    q = _apply_filters(q, search, category_id, approval_status, is_trending, is_featured)
    total = db.execute(q).scalar() or 0
    return {"total": total}


@router.get("/requests")
def list_pending_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    q = (
        _base_query()
        .where(BizService.approval_status == ServiceApprovalStatus.PENDING.value)
        .order_by(BizService.created_at.desc())
    )

    offset = (page - 1) * page_size
    q = q.offset(offset).limit(page_size)

    results = db.execute(q).unique().scalars().all()
    return [_serialize_service(s) for s in results]


@router.get("/{service_id}")
def get_service_detail(
    service_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    q = _base_query().where(BizService.id == service_id)
    svc = db.execute(q).unique().scalars().first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    return _serialize_service(svc)


@router.patch("/{service_id}/approve")
def approve_service(
    service_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    svc = db.get(BizService, service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    svc.approval_status = ServiceApprovalStatus.APPROVED.value
    svc.rejection_reason = None
    db.commit()
    db.refresh(svc)
    return {"id": svc.id, "approval_status": svc.approval_status}


@router.patch("/{service_id}/reject")
def reject_service(
    service_id: int,
    data: RejectRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    svc = db.get(BizService, service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    svc.approval_status = ServiceApprovalStatus.REJECTED.value
    svc.rejection_reason = data.rejection_reason
    db.commit()
    db.refresh(svc)
    return {"id": svc.id, "approval_status": svc.approval_status, "rejection_reason": svc.rejection_reason}


@router.patch("/{service_id}/toggle-trending")
def toggle_trending(
    service_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    svc = db.get(BizService, service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    svc.is_trending = not svc.is_trending
    db.commit()
    db.refresh(svc)
    return {"id": svc.id, "is_trending": svc.is_trending}


@router.patch("/{service_id}/toggle-featured")
def toggle_featured(
    service_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    svc = db.get(BizService, service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    svc.is_featured = not svc.is_featured
    db.commit()
    db.refresh(svc)
    return {"id": svc.id, "is_featured": svc.is_featured}


@router.patch("/{service_id}/order")
def update_sort_order(
    service_id: int,
    data: SortOrderUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    svc = db.get(BizService, service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    svc.sort_order = data.sort_order
    db.commit()
    db.refresh(svc)
    return {"id": svc.id, "sort_order": svc.sort_order}


@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    hard: bool = Query(False),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    svc = db.get(BizService, service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    if hard:
        db.delete(svc)
    else:
        svc.status = ServiceStatus.INACTIVE.value
    db.commit()
    return {"id": service_id, "deleted": hard}


@router.patch("/requests/{service_id}")
def review_service_request(
    service_id: int,
    data: ServiceActionRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    svc = db.get(BizService, service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    if data.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")

    if data.action == "approve":
        svc.approval_status = ServiceApprovalStatus.APPROVED.value
        svc.rejection_reason = None
    else:
        svc.approval_status = ServiceApprovalStatus.REJECTED.value
        svc.rejection_reason = data.rejection_reason

    db.commit()
    db.refresh(svc)
    return {
        "id": svc.id,
        "approval_status": svc.approval_status,
        "rejection_reason": svc.rejection_reason,
    }
