"""In-app notification endpoints — shared by all authenticated roles."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.dependencies.auth import require_user
from app.dependencies.database import get_db_session
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notifications import (
    NotificationListResponse,
    NotificationReadAllResponse,
    NotificationResponse,
    UnreadNotificationsResponse,
)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    page: int = 1,
    page_size: int = 20,
    unread_only: bool = False,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db_session),
) -> NotificationListResponse:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    offset = (page - 1) * page_size

    total_q = select(func.count()).select_from(Notification).where(
        Notification.user_id == current_user.id
    )
    unread_q = select(func.count()).select_from(Notification).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False,  # noqa: E712
    )
    rows_q = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .offset(offset)
        .limit(page_size)
    )
    if unread_only:
        rows_q = rows_q.where(Notification.is_read == False)  # noqa: E712
        total_q = total_q.where(Notification.is_read == False)  # noqa: E712

    items = db.execute(rows_q).scalars().all()
    return NotificationListResponse(
        items=items,
        total=db.execute(total_q).scalar() or 0,
        unread=db.execute(unread_q).scalar() or 0,
        page=page,
        page_size=page_size,
    )


@router.get("/unread-count", response_model=UnreadNotificationsResponse)
def unread_count(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db_session),
) -> UnreadNotificationsResponse:
    unread = (
        db.execute(
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.user_id == current_user.id,
                Notification.is_read == False,  # noqa: E712
            )
        ).scalar()
        or 0
    )
    return UnreadNotificationsResponse(unread=unread)


@router.patch("/read-all", response_model=NotificationReadAllResponse)
def mark_all_read(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db_session),
) -> NotificationReadAllResponse:
    rows = (
        db.execute(
            select(Notification).where(
                Notification.user_id == current_user.id,
                Notification.is_read == False,  # noqa: E712
            )
        )
        .scalars()
        .all()
    )
    for notif in rows:
        notif.is_read = True
    db.commit()
    return NotificationReadAllResponse(updated=len(rows))


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db_session),
) -> Notification:
    notif = db.get(Notification, notification_id)
    if notif is None or notif.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif