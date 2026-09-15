from datetime import datetime

from pydantic import BaseModel

from app.models.document import DocumentType, VerificationStatus


class DocumentResponse(BaseModel):
    id: int
    profile_id: int
    document_type: DocumentType
    file_name: str
    file_url: str
    mime_type: str
    file_size: int
    verification_status: VerificationStatus
    uploaded_by: int | None
    rejection_reason: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentVerifyRequest(BaseModel):
    status: VerificationStatus
    rejection_reason: str | None = None
