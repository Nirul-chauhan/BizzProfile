import os
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.biz_profile import BizProfile
from app.models.document import Document, DocumentType, VerificationStatus
from app.services.storage import LocalStorageService, StorageService


ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class DocumentError(Exception):
    pass


class DocumentService:
    def __init__(self, db: Session, storage: StorageService | None = None) -> None:
        self.db = db
        self.storage = storage or LocalStorageService()

    def _get_profile(self, profile_id: int) -> BizProfile:
        profile = self.db.execute(
            select(BizProfile).where(BizProfile.id == profile_id)
        ).scalars().first()
        if profile is None:
            raise DocumentError("Profile not found.")
        return profile

    def _check_ownership(self, profile: BizProfile, user_id: int, is_admin: bool) -> None:
        if not is_admin and profile.user_id != user_id:
            raise DocumentError("You can only upload documents to your own profiles.")

    def _validate_file(self, mime_type: str, file_size: int) -> None:
        if mime_type not in ALLOWED_MIME_TYPES:
            allowed = ", ".join(sorted(ALLOWED_MIME_TYPES))
            raise DocumentError(
                f"File type '{mime_type}' is not allowed. Allowed types: {allowed}"
            )
        if file_size > MAX_FILE_SIZE:
            max_mb = MAX_FILE_SIZE // (1024 * 1024)
            raise DocumentError(f"File size exceeds maximum of {max_mb} MB.")

    def upload(
        self,
        profile_id: int,
        document_type: DocumentType,
        file_name: str,
        file_content: bytes,
        mime_type: str,
        file_size: int,
        user_id: int,
        is_admin: bool = False,
    ) -> Document:
        profile = self._get_profile(profile_id)
        self._check_ownership(profile, user_id, is_admin)
        self._validate_file(mime_type, file_size)

        file_path = self.storage.save(file_content, file_name, folder=str(profile_id))

        document = Document(
            profile_id=profile_id,
            document_type=document_type.value,
            file_name=file_name,
            file_url=file_path,
            mime_type=mime_type,
            file_size=file_size,
            verification_status=VerificationStatus.PENDING.value,
            uploaded_by=user_id,
        )
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return document

    def get_by_profile(self, profile_id: int) -> list[Document]:
        self._get_profile(profile_id)
        return list(
            self.db.execute(
                select(Document)
                .where(Document.profile_id == profile_id)
                .order_by(Document.created_at.desc())
            ).scalars().all()
        )

    def get_by_id(self, document_id: int) -> Document:
        doc = self.db.execute(
            select(Document).where(Document.id == document_id)
        ).scalars().first()
        if doc is None:
            raise DocumentError("Document not found.")
        return doc

    def delete(
        self,
        document_id: int,
        user_id: int,
        is_admin: bool = False,
    ) -> None:
        doc = self.get_by_id(document_id)
        profile = self._get_profile(doc.profile_id)
        self._check_ownership(profile, user_id, is_admin)

        self.storage.delete(doc.file_url)
        self.db.delete(doc)
        self.db.commit()

    def get_all_pending(self) -> list[Document]:
        return list(
            self.db.execute(
                select(Document)
                .where(Document.verification_status == VerificationStatus.PENDING.value)
                .order_by(Document.created_at.desc())
            ).scalars().all()
        )

    def get_all(self) -> list[Document]:
        return list(
            self.db.execute(
                select(Document).order_by(Document.created_at.desc())
            ).scalars().all()
        )

    def verify(
        self,
        document_id: int,
        status: VerificationStatus,
        rejection_reason: str | None = None,
    ) -> Document:
        doc = self.get_by_id(document_id)
        doc.verification_status = status.value
        if status == VerificationStatus.REJECTED:
            if not rejection_reason:
                raise DocumentError("Rejection reason is required when rejecting a document.")
            doc.rejection_reason = rejection_reason
        elif status == VerificationStatus.APPROVED:
            doc.rejection_reason = None
        self.db.commit()
        self.db.refresh(doc)
        return doc
