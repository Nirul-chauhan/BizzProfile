from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db_session
from app.models.biz_profile import BizProfile
from app.models.user import User
from app.schemas.admin import (
    AdminProfileResponse,
    AdminProfileToggleActive,
    AdminProfileTogglePublic,
    AdminProfileToggleVerified,
)
from app.services.biz_profile import BizProfileError, BizProfileService

router = APIRouter(prefix="/api/admin/profiles", tags=["admin-profiles"])


@router.get("", response_model=list[AdminProfileResponse])
def list_all_profiles(
    q: str | None = Query(None, description="Search by business name"),
    profile_type: str | None = Query(None, description="Filter by COMPANY/INDIVIDUAL/MSME"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    is_verified: bool | None = Query(None, description="Filter by verified status"),
    category_id: int | None = Query(None, description="Filter by category ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    stmt = select(BizProfile).order_by(BizProfile.created_at.desc())

    if q:
        stmt = stmt.where(BizProfile.business_name.ilike(f"%{q}%"))

    if profile_type:
        stmt = stmt.where(BizProfile.profile_type == profile_type.upper())

    if is_active is not None:
        stmt = stmt.where(BizProfile.is_active == is_active)

    if is_verified is not None:
        stmt = stmt.where(BizProfile.is_verified == is_verified)

    if category_id is not None:
        stmt = stmt.where(BizProfile.category_id == category_id)

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    profiles = db.execute(stmt).scalars().all()
    return [AdminProfileResponse.model_validate(p) for p in profiles]


@router.get("/count")
def profile_count(
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    total = db.execute(select(func.count(BizProfile.id))).scalar() or 0
    active = db.execute(
        select(func.count(BizProfile.id)).where(BizProfile.is_active == True)
    ).scalar() or 0
    verified = db.execute(
        select(func.count(BizProfile.id)).where(BizProfile.is_verified == True)
    ).scalar() or 0
    return {"total": total, "active": active, "verified": verified, "inactive": total - active}


@router.get("/{profile_id}", response_model=AdminProfileResponse)
def get_profile(
    profile_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = BizProfileService(db)
    try:
        profile = svc.get_by_id(profile_id)
    except BizProfileError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return AdminProfileResponse.model_validate(profile)


@router.put("/{profile_id}/verify", response_model=AdminProfileResponse)
def verify_profile(
    profile_id: int,
    request: AdminProfileToggleVerified,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = BizProfileService(db)
    try:
        profile = svc.update(
            profile_id=profile_id,
            user_id=_admin.id,
            is_admin=True,
            is_verified=request.is_verified,
        )
    except BizProfileError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return AdminProfileResponse.model_validate(profile)


@router.put("/{profile_id}/active", response_model=AdminProfileResponse)
def toggle_profile_active(
    profile_id: int,
    request: AdminProfileToggleActive,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = BizProfileService(db)
    try:
        profile = svc.update(
            profile_id=profile_id,
            user_id=_admin.id,
            is_admin=True,
            is_active=request.is_active,
        )
    except BizProfileError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return AdminProfileResponse.model_validate(profile)


@router.put("/{profile_id}/public", response_model=AdminProfileResponse)
def toggle_profile_public(
    profile_id: int,
    request: AdminProfileTogglePublic,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = BizProfileService(db)
    try:
        profile = svc.update(
            profile_id=profile_id,
            user_id=_admin.id,
            is_admin=True,
            is_public=request.is_public,
        )
    except BizProfileError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return AdminProfileResponse.model_validate(profile)


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(
    profile_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = BizProfileService(db)
    try:
        svc.delete(profile_id=profile_id, user_id=_admin.id, is_admin=True)
    except BizProfileError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
