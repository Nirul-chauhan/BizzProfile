"""Notification Pydantic schemas."""
from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    enquiry_id: int | None
    quotation_id: int | None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    unread: int
    page: int
    page_size: int


class UnreadNotificationsResponse(BaseModel):
    unread: int


class NotificationReadAllResponse(BaseModel):
    updated: int