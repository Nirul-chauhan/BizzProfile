from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db_session
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentVerifyRequest
from app.services.document import DocumentError, DocumentService, VerificationStatus

router = APIRouter(prefix="/api/admin/documents", tags=["admin-documents"])


@router.get("", response_model=list[DocumentResponse])
def list_all_documents(
    verification_status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_session),
    _current_user: User = Depends(require_admin),
):
    svc = DocumentService(db)
    docs = svc.get_all()

    if verification_status:
        docs = [d for d in docs if d.verification_status == verification_status]

    total = len(docs)
    start = (page - 1) * page_size
    end = start + page_size

    return [DocumentResponse.model_validate(d) for d in docs[start:end]]


@router.put(
    "/{document_id}/verify",
    response_model=DocumentResponse,
)
def verify_document(
    document_id: int,
    request: DocumentVerifyRequest,
    db: Session = Depends(get_db_session),
    _current_user: User = Depends(require_admin),
):
    svc = DocumentService(db)
    try:
        doc = svc.verify(
            document_id=document_id,
            status=request.status,
            rejection_reason=request.rejection_reason,
        )
    except DocumentError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return DocumentResponse.model_validate(doc)
