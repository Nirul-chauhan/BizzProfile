"""Notification helpers — persist in-app notifications for workflow events."""
from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    *,
    user_id: int,
    type: str,
    title: str,
    message: str,
    enquiry_id: int | None = None,
    quotation_id: int | None = None,
) -> Notification:
    """Create a notification row for `user_id`.

    The row is queued on the session but NOT committed — callers add it
    alongside their own change so both land in one transaction.
    """
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        enquiry_id=enquiry_id,
        quotation_id=quotation_id,
    )
    db.add(notif)
    return notif