from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db_session
from app.models.biz_profile import BizProfile
from app.models.document import Document, VerificationStatus
from app.models.user import User
from app.schemas.admin import AdminStatsResponse

router = APIRouter(prefix="/api/admin/stats", tags=["admin-stats"])


@router.get("", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    total_users = db.execute(select(func.count(User.id))).scalar() or 0
    active_users = db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    ).scalar() or 0

    total_profiles = db.execute(select(func.count(BizProfile.id))).scalar() or 0
    active_profiles = db.execute(
        select(func.count(BizProfile.id)).where(BizProfile.is_active == True)
    ).scalar() or 0

    pending_documents = db.execute(
        select(func.count(Document.id)).where(
            Document.verification_status == VerificationStatus.PENDING.value
        )
    ).scalar() or 0
    total_documents = db.execute(select(func.count(Document.id))).scalar() or 0

    company_profiles = db.execute(
        select(func.count(BizProfile.id)).where(BizProfile.profile_type == "COMPANY")
    ).scalar() or 0
    individual_profiles = db.execute(
        select(func.count(BizProfile.id)).where(BizProfile.profile_type == "INDIVIDUAL")
    ).scalar() or 0
    msme_profiles = db.execute(
        select(func.count(BizProfile.id)).where(BizProfile.profile_type == "MSME")
    ).scalar() or 0

    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_users = db.execute(
        select(func.count(User.id)).where(User.created_at >= seven_days_ago)
    ).scalar() or 0
    recent_profiles = db.execute(
        select(func.count(BizProfile.id)).where(BizProfile.created_at >= seven_days_ago)
    ).scalar() or 0

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_profiles=total_profiles,
        active_profiles=active_profiles,
        pending_documents=pending_documents,
        total_documents=total_documents,
        profiles_by_type={
            "COMPANY": company_profiles,
            "INDIVIDUAL": individual_profiles,
            "MSME": msme_profiles,
        },
        recent_users=recent_users,
        recent_profiles=recent_profiles,
    )
