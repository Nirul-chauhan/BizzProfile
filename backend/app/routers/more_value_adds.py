from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db_session
from app.models.more_value_adds import MoreValueAdds
from app.models.user import User
from app.schemas.more_value_adds import (
    MoreValueAddsCreate,
    MoreValueAddsResponse,
    MoreValueAddsUpdate,
)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/svg+xml"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

router = APIRouter(tags=["more-value-adds"])


# ---------------------------------------------------------------------------
# Public
# ---------------------------------------------------------------------------
@router.get("/api/more-value-adds", response_model=list[MoreValueAddsResponse])
def list_active_more_value_adds(
    db: Session = Depends(get_db_session),
):
    items = list(
        db.execute(
            select(MoreValueAdds)
            .where(MoreValueAdds.is_active == True)
            .order_by(MoreValueAdds.display_order, MoreValueAdds.id)
        )
        .scalars()
        .all()
    )
    return [MoreValueAddsResponse.model_validate(i) for i in items]


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------
@router.get("/api/admin/more-value-adds", response_model=list[MoreValueAddsResponse])
def admin_list_more_value_adds(
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    items = list(
        db.execute(
            select(MoreValueAdds).order_by(MoreValueAdds.display_order, MoreValueAdds.id)
        )
        .scalars()
        .all()
    )
    return [MoreValueAddsResponse.model_validate(i) for i in items]


@router.post(
    "/api/admin/more-value-adds",
    response_model=MoreValueAddsResponse,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_more_value_adds(
    request: MoreValueAddsCreate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    item = MoreValueAdds(
        title=request.title,
        description=request.description,
        icon=request.icon,
        image_url=request.image_url,
        button_text=request.button_text,
        button_link=request.button_link,
        display_order=request.display_order,
        is_active=request.is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return MoreValueAddsResponse.model_validate(item)


@router.get(
    "/api/admin/more-value-adds/{item_id}", response_model=MoreValueAddsResponse
)
def admin_get_more_value_adds(
    item_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    item = db.get(MoreValueAdds, item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found."
        )
    return MoreValueAddsResponse.model_validate(item)


@router.put(
    "/api/admin/more-value-adds/{item_id}", response_model=MoreValueAddsResponse
)
def admin_update_more_value_adds(
    item_id: int,
    request: MoreValueAddsUpdate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    item = db.get(MoreValueAdds, item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found."
        )

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return MoreValueAddsResponse.model_validate(item)


@router.delete(
    "/api/admin/more-value-adds/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def admin_delete_more_value_adds(
    item_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    item = db.get(MoreValueAdds, item_id)
    if item is None:
        raise HTTPException(
status_code=status.HTTP_404_NOT_FOUND, detail="Item not found."
        )
    db.delete(item)
    db.commit()


@router.post(
    "/api/admin/more-value-adds/{item_id}/image",
    response_model=MoreValueAddsResponse,
)
async def admin_upload_more_value_adds_image(
    item_id: int,
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

    item = db.get(MoreValueAdds, item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found."
        )

    from app.services.storage import LocalStorageService

    storage = LocalStorageService()
    file_path = storage.save(
        content, file.filename or "value-add.png", folder="more-value-adds"
    )

    item.image_url = storage.get_url(file_path)
    db.commit()
    db.refresh(item)
    return MoreValueAddsResponse.model_validate(item)
