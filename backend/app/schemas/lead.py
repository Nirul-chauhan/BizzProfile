from datetime import datetime
from pydantic import BaseModel, Field


class LeadCreate(BaseModel):
    product_id: int
    message: str | None = Field(None, max_length=2000)
    phone_to_call: str | None = Field(None, max_length=20)


class LeadUpdate(BaseModel):
    status: str = Field(..., pattern=r"^(NEW|CONTACTED|CLOSED)$")
    message: str | None = Field(None, max_length=2000)


class LeadResponse(BaseModel):
    id: int
    product_id: int
    buyer_id: int
    message: str | None
    phone_to_call: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
