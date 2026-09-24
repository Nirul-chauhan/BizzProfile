from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db_session
from app.models.biz_profile import BizProfile
from app.models.document import Document, VerificationStatus
from app.models.role import Role
from app.models.user import User

router = APIRouter(prefix="/api/admin/dashboard", tags=["admin-dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    total_users = db.execute(select(func.count(User.id))).scalar() or 0

    customers = db.execute(
        select(func.count(User.id))
        .join(Role)
        .where(Role.name.in_(["BUYER", "CUSTOMER"]))
    ).scalar() or 0

    end_users = db.execute(
        select(func.count(User.id))
        .join(Role)
        .where(Role.name.in_(["SELLER", "ENDUSER"]))
    ).scalar() or 0

    admins = db.execute(
        select(func.count(User.id))
        .join(Role)
        .where(Role.name == "ADMIN")
    ).scalar() or 0

    total_businesses = db.execute(select(func.count(BizProfile.id))).scalar() or 0

    verified_businesses = db.execute(
        select(func.count(BizProfile.id)).where(BizProfile.is_verified == True)
    ).scalar() or 0

    pending_businesses = db.execute(
        select(func.count(BizProfile.id)).where(BizProfile.is_verified == False)
    ).scalar() or 0

    featured_businesses = db.execute(
        select(func.count(BizProfile.id)).where(BizProfile.is_featured == True)
    ).scalar() or 0

    total_documents = db.execute(select(func.count(Document.id))).scalar() or 0

    pending_documents = db.execute(
        select(func.count(Document.id)).where(
            Document.verification_status == VerificationStatus.PENDING.value
        )
    ).scalar() or 0

    return {
        "totalUsers": total_users,
        "totalCustomers": customers,
        "totalEndUsers": end_users,
        "totalAdmins": admins,
        "totalBusinesses": total_businesses,
        "verifiedBusinesses": verified_businesses,
        "pendingBusinesses": pending_businesses,
        "featuredBusinesses": featured_businesses,
        "totalDocuments": total_documents,
        "pendingDocuments": pending_documents,
    }


@router.get("/activity")
def get_activity_logs(
    limit: int = 20,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    activities = []

    recent_users = db.execute(
        select(User).order_by(User.created_at.desc()).limit(limit)
    ).scalars().all()

    for user in recent_users:
        activities.append({
            "id": f"user-{user.id}",
            "user": user.full_name,
            "activityType": "User registered",
            "entity": user.email,
            "timestamp": user.created_at.isoformat(),
            "status": "high" if user.role.name == "ADMIN" else "medium",
        })

    recent_profiles = db.execute(
        select(BizProfile).order_by(BizProfile.created_at.desc()).limit(limit)
    ).scalars().all()

    for profile in recent_profiles:
        activities.append({
            "id": f"profile-{profile.id}",
            "user": profile.business_name,
            "activityType": "Profile created",
            "entity": profile.profile_type,
            "timestamp": profile.created_at.isoformat(),
            "status": "high" if profile.is_verified else "low",
        })

    recent_documents = db.execute(
        select(Document).order_by(Document.created_at.desc()).limit(limit)
    ).scalars().all()

    for doc in recent_documents:
        activities.append({
            "id": f"doc-{doc.id}",
            "user": doc.file_name,
            "activityType": "Document uploaded",
            "entity": doc.document_type,
            "timestamp": doc.created_at.isoformat(),
            "status": "medium" if doc.verification_status == VerificationStatus.PENDING.value else "low",
        })

    activities.sort(key=lambda x: x["timestamp"], reverse=True)

    return {"activities": activities[:limit]}
