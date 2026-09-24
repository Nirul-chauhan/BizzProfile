from datetime import datetime
from pydantic import BaseModel, Field


class SocietyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    pincode: str | None = Field(None, max_length=10)


class SocietyUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    pincode: str | None = Field(None, max_length=10)


class SocietyResponse(BaseModel):
    id: int
    name: str
    address: str | None
    city: str | None
    pincode: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
