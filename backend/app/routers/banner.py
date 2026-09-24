from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db_session
from app.models.banner import Banner
from app.models.user import User
from app.schemas.banner import BannerCreate, BannerResponse, BannerUpdate

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/svg+xml"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

router = APIRouter(tags=["banners"])


# ---------------------------------------------------------------------------
# Public
# ---------------------------------------------------------------------------


@router.get("/api/banners", response_model=list[BannerResponse])
def list_active_banners(
    db: Session = Depends(get_db_session),
):
    banners = list(
        db.execute(
            select(Banner)
            .where(Banner.is_active == True)
            .order_by(Banner.sort_order, Banner.id)
        ).scalars().all()
    )
    return [BannerResponse.model_validate(b) for b in banners]


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------


@router.get("/api/admin/banners", response_model=list[BannerResponse])
def admin_list_banners(
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    banners = list(
        db.execute(
            select(Banner).order_by(Banner.sort_order, Banner.id)
        ).scalars().all()
    )
    return [BannerResponse.model_validate(b) for b in banners]


@router.post(
    "/api/admin/banners",
    response_model=BannerResponse,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_banner(
    request: BannerCreate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    banner = Banner(
        title=request.title,
        subtitle=request.subtitle,
        cta_text=request.cta_text,
        cta_url=request.cta_url,
        image_url=request.image_url,
        gradient=request.gradient,
        is_active=request.is_active,
        sort_order=request.sort_order,
    )
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return BannerResponse.model_validate(banner)


@router.put("/api/admin/banners/{banner_id}", response_model=BannerResponse)
def admin_update_banner(
    banner_id: int,
    request: BannerUpdate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    banner = db.get(Banner, banner_id)
    if banner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found."
        )

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(banner, field, value)

    db.commit()
    db.refresh(banner)
    return BannerResponse.model_validate(banner)


@router.delete(
    "/api/admin/banners/{banner_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def admin_delete_banner(
    banner_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    banner = db.get(Banner, banner_id)
    if banner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found."
        )
    db.delete(banner)
    db.commit()


@router.post(
    "/api/admin/banners/{banner_id}/image",
    response_model=BannerResponse,
)
async def admin_upload_banner_image(
    banner_id: int,
    file: UploadFile,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
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

    banner = db.get(Banner, banner_id)
    if banner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found."
        )

    from app.services.storage import LocalStorageService

    storage = LocalStorageService()
    file_path = storage.save(content, file.filename or "banner.png", folder="banners")
    image_url = storage.get_url(file_path)

    banner.image_url = image_url
    db.commit()
    db.refresh(banner)
    return BannerResponse.model_validate(banner)
