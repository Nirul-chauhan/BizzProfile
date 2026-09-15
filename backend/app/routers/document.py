from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user, require_user
from app.dependencies.database import get_db_session
from app.models.document import DocumentType
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.document import ALLOWED_MIME_TYPES, MAX_FILE_SIZE, DocumentError, DocumentService

router = APIRouter(prefix="/api/profiles", tags=["documents"])


@router.post(
    "/{profile_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    profile_id: int,
    document_type: DocumentType = Form(...),
    file: UploadFile = Form(...),
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' is not allowed.",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum of {max_mb} MB.",
        )

    svc = DocumentService(db)
    is_admin = current_user.role.name == "ADMIN"
    try:
        doc = svc.upload(
            profile_id=profile_id,
            document_type=document_type,
            file_name=file.filename or "unknown",
            file_content=content,
            mime_type=file.content_type or "application/octet-stream",
            file_size=len(content),
            user_id=current_user.id,
            is_admin=is_admin,
        )
    except DocumentError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return DocumentResponse.model_validate(doc)


@router.get(
    "/{profile_id}/documents",
    response_model=list[DocumentResponse],
)
def list_documents(
    profile_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentService(db)
    try:
        docs = svc.get_by_profile(profile_id)
    except DocumentError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return [DocumentResponse.model_validate(d) for d in docs]


documents_router = APIRouter(prefix="/api/documents", tags=["documents"])


@documents_router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    svc = DocumentService(db)
    is_admin = current_user.role.name == "ADMIN"
    try:
        svc.delete(
            document_id=document_id,
            user_id=current_user.id,
            is_admin=is_admin,
        )
    except DocumentError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
