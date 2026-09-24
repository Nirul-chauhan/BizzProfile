from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db_session
from app.models.category import Category, Subcategory
from app.models.user import User
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    SubcategoryCreate,
    SubcategoryResponse,
    SubcategoryUpdate,
)
from app.services.category import CategoryError, CategoryService

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/svg+xml"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

router = APIRouter(prefix="/api/admin", tags=["admin-categories"])


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = CategoryService(db)
    categories = svc.get_categories(include_inactive=True)
    return [CategoryResponse.model_validate(c) for c in categories]


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    request: CategoryCreate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = CategoryService(db)
    try:
        category = svc.create_category(
            parent_id=request.parent_id,
            name=request.name,
            slug=request.slug,
            description=request.description,
            is_active=request.is_active,
            icon=request.icon,
            logo_url=request.logo_url,
            is_popular=request.is_popular,
            sort_order=request.sort_order,
            is_trending=request.is_trending,
            trending_order=request.trending_order,
        )
    except CategoryError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return CategoryResponse.model_validate(category)


@router.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    request: CategoryUpdate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = CategoryService(db)
    try:
        category = svc.update_category(
            category_id,
            parent_id=request.parent_id,
            name=request.name,
            slug=request.slug,
            description=request.description,
            is_active=request.is_active,
            icon=request.icon,
            logo_url=request.logo_url,
            is_popular=request.is_popular,
            sort_order=request.sort_order,
            is_trending=request.is_trending,
            trending_order=request.trending_order,
        )
    except CategoryError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return CategoryResponse.model_validate(category)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = CategoryService(db)
    try:
        svc.delete_category(category_id)
    except CategoryError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/categories/{category_id}/subcategories",
    response_model=SubcategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_subcategory(
    category_id: int,
    request: SubcategoryCreate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = CategoryService(db)
    try:
        sub = svc.create_subcategory(
            category_id=category_id,
            name=request.name,
            slug=request.slug,
            description=request.description,
            is_active=request.is_active,
            keywords=request.keywords,
            sort_order=request.sort_order,
            is_trending=request.is_trending,
        )
    except CategoryError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return SubcategoryResponse.model_validate(sub)


@router.put("/subcategories/{subcategory_id}", response_model=SubcategoryResponse)
def update_subcategory(
    subcategory_id: int,
    request: SubcategoryUpdate,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = CategoryService(db)
    try:
        sub = svc.update_subcategory(
            subcategory_id,
            name=request.name,
            slug=request.slug,
            description=request.description,
            is_active=request.is_active,
            keywords=request.keywords,
            sort_order=request.sort_order,
            is_trending=request.is_trending,
            category_id=request.category_id,
        )
    except CategoryError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return SubcategoryResponse.model_validate(sub)


@router.delete("/subcategories/{subcategory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subcategory(
    subcategory_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    svc = CategoryService(db)
    try:
        svc.delete_subcategory(subcategory_id)
    except CategoryError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/subcategories", response_model=list[SubcategoryResponse])
def list_all_subcategories(
    category_id: int | None = Query(None),
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    query = select(Subcategory).options(joinedload(Subcategory.category)).order_by(Subcategory.sort_order, Subcategory.name)
    if category_id:
        query = query.where(Subcategory.category_id == category_id)
    subs = list(db.execute(query).scalars().unique().all())
    return [SubcategoryResponse.model_validate(s) for s in subs]


@router.post("/categories/{category_id}/logo", response_model=CategoryResponse)
async def upload_category_logo(
    category_id: int,
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

    svc = CategoryService(db)
    try:
        category = svc.get_category_by_id(category_id)
    except CategoryError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    from app.services.storage import LocalStorageService
    storage = LocalStorageService()
    file_path = storage.save(content, file.filename or "category-logo.png", folder="categories")
    logo_url = storage.get_url(file_path)

    category.logo_url = logo_url
    db.commit()
    db.refresh(category)
    return CategoryResponse.model_validate(category)


# ---------------------------------------------------------------------------
# Trending Categories
# ---------------------------------------------------------------------------

class ToggleTrendingRequest(BaseModel):
    is_trending: bool


class UpdateTrendingOrderRequest(BaseModel):
    trending_order: int


@router.get("/trending-categories", response_model=list[CategoryResponse])
def list_trending_categories(
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    q = (
        select(Category)
        .where(Category.is_trending == True)
        .order_by(Category.trending_order.asc(), Category.name.asc())
    )
    cats = db.execute(q).scalars().all()
    return [CategoryResponse.model_validate(c) for c in cats]


@router.patch("/categories/{category_id}/trending")
def toggle_trending(
    category_id: int,
    data: ToggleTrendingRequest,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    cat = db.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.is_trending = data.is_trending
    if not data.is_trending:
        cat.trending_order = 0
    db.commit()
    return {"ok": True, "is_trending": cat.is_trending}


@router.patch("/categories/{category_id}/trending-order")
def update_trending_order(
    category_id: int,
    data: UpdateTrendingOrderRequest,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    cat = db.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.trending_order = data.trending_order
    db.commit()
    return {"ok": True, "trending_order": cat.trending_order}
