import io

from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db_session
from app.models.app_promo import AppPromo
from app.models.user import User
from app.schemas.app_promo import AppPromoResponse, AppPromoUpdate

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/svg+xml"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
UPLOADABLE_FIELDS = {"image_url", "qr_code_url"}

DEFAULT_HEADING = "Download Our BizzProfile App"
DEFAULT_DESCRIPTION = (
    "Search verified businesses, products and services on the go. "
    "Compare quotes, chat with sellers and manage your enquiries - "
    "everything from your phone."
)

router = APIRouter(tags=["app-promo"])


def _get_or_create(db: Session) -> AppPromo:
    """Return the singleton app-promo row, creating it with defaults if missing."""
    row = db.execute(select(AppPromo).order_by(AppPromo.id)).scalars().first()
    if row is None:
        row = AppPromo(
            heading=DEFAULT_HEADING,
            description=DEFAULT_DESCRIPTION,
            is_active=True,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _serialize(row: AppPromo) -> AppPromoResponse:
    return AppPromoResponse.model_validate(row)


# ---------------------------------------------------------------------------
# Public
# ---------------------------------------------------------------------------
@router.get("/api/public/app-promo", response_model=AppPromoResponse | None)
def get_public_app_promo(
    db: Session = Depends(get_db_session),
):
    """Content for the homepage app-promotional section.

    Returns ``null`` when the section has been switched off by an admin.
    """
    row = _get_or_create(db)
    if not row.is_active:
        return None
    return _serialize(row)


@router.get("/api/public/app-promo/qr")
def get_public_app_promo_qr(
    request: Request,
    db: Session = Depends(get_db_session),
):
    """PNG QR code for the app section.

    Uses the uploaded QR image target: Google Play link, else App Store link,
    else the site the visitor is browsing. Generated on demand so no QR image
    asset has to be stored.
    """
    row = db.execute(select(AppPromo).order_by(AppPromo.id)).scalars().first()
    if row is None or not row.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="App promo is not active."
        )

    target = row.google_play_url or row.app_store_url or str(request.base_url)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No QR target configured."
        )

    import qrcode

    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=2)
    qr.add_data(target)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return Response(
        content=buffer.getvalue(),
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=3600"},
    )


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------
@router.get("/api/admin/app-promo", response_model=AppPromoResponse)
def admin_get_app_promo(
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    return _serialize(_get_or_create(db))


@router.put("/api/admin/app-promo", response_model=AppPromoResponse)
def admin_update_app_promo(
    request: AppPromoUpdate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    row = _get_or_create(db)
    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return _serialize(row)


@router.post("/api/admin/app-promo/upload", response_model=AppPromoResponse)
async def admin_upload_app_promo_asset(
    file: UploadFile,
    field: str = Query("image_url"),
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    if field not in UPLOADABLE_FIELDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="field must be 'image_url' or 'qr_code_url'.",
        )
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' is not allowed. Use JPEG, PNG, WebP, or SVG.",
        )

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum of 5 MB.",
        )

    from app.services.storage import LocalStorageService

    storage = LocalStorageService()
    file_path = storage.save(content, file.filename or "app-promo.png", folder="app-promo")
    image_url = storage.get_url(file_path)

    row = _get_or_create(db)
    setattr(row, field, image_url)
    db.commit()
    db.refresh(row)
    return _serialize(row)
