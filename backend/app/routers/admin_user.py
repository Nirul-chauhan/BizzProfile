from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db_session
from app.models.role import Role
from app.models.user import User
from app.schemas.admin import (
    AdminUserResponse,
    AdminUserToggleActive,
    AdminUserUpdateRole,
)

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])


@router.get("", response_model=list[AdminUserResponse])
def list_users(
    q: str | None = Query(None, description="Search by name or email"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    role: str | None = Query(None, description="Filter by role name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    stmt = select(User).order_by(User.created_at.desc())

    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(
            (User.full_name.ilike(pattern)) | (User.email.ilike(pattern))
        )

    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)

    if role:
        stmt = stmt.join(User.role).where(Role.name == role.upper())

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    users = db.execute(stmt).scalars().all()
    return [AdminUserResponse.model_validate(u) for u in users]


@router.get("/count")
def user_count(
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    total = db.execute(select(func.count(User.id))).scalar() or 0
    active = db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    ).scalar() or 0
    return {"total": total, "active": active, "inactive": total - active}


@router.get("/{user_id}", response_model=AdminUserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    user = db.execute(select(User).where(User.id == user_id)).scalars().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return AdminUserResponse.model_validate(user)


@router.put("/{user_id}/role", response_model=AdminUserResponse)
def update_user_role(
    user_id: int,
    request: AdminUserUpdateRole,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    user = db.execute(select(User).where(User.id == user_id)).scalars().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    role = db.execute(select(Role).where(Role.name == request.role_name)).scalars().first()
    if role is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role name.")

    user.role_id = role.id
    db.commit()
    db.refresh(user)
    return AdminUserResponse.model_validate(user)


@router.put("/{user_id}/active", response_model=AdminUserResponse)
def toggle_user_active(
    user_id: int,
    request: AdminUserToggleActive,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    user = db.execute(select(User).where(User.id == user_id)).scalars().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.is_active = request.is_active
    db.commit()
    db.refresh(user)
    return AdminUserResponse.model_validate(user)
