from datetime import datetime
from pydantic import BaseModel, Field


class MoreValueAddsCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=500)
    icon: str | None = Field(None, max_length=500)
    image_url: str | None = Field(None, max_length=500)
    button_text: str | None = Field(None, max_length=100)
    button_link: str | None = Field(None, max_length=500)
    display_order: int = 0
    is_active: bool = True


class MoreValueAddsUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=500)
    icon: str | None = Field(None, max_length=500)
    image_url: str | None = Field(None, max_length=500)
    button_text: str | None = Field(None, max_length=100)
    button_link: str | None = Field(None, max_length=500)
    display_order: int | None = None
    is_active: bool | None = None


class MoreValueAddsResponse(BaseModel):
    id: int
    title: str
    description: str | None
    icon: str | None
    image_url: str | None
    button_text: str | None
    button_link: str | None
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
