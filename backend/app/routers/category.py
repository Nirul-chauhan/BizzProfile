from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.database import get_db_session
from app.models.category import Category
from app.schemas.category import CategoryResponse, CategoryWithSubcategories, SubcategoryResponse
from app.services.category import CategoryError, CategoryService

router = APIRouter(prefix="/api", tags=["categories"])


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db_session)):
    svc = CategoryService(db)
    return [CategoryResponse.model_validate(c) for c in svc.get_categories()]


@router.get("/categories/popular", response_model=list[CategoryResponse])
def list_popular_categories(db: Session = Depends(get_db_session)):
    categories = list(
        db.execute(
            select(Category)
            .where(Category.is_popular == True, Category.is_active == True)
            .order_by(Category.sort_order, Category.name)
        ).scalars().all()
    )
    return [CategoryResponse.model_validate(c) for c in categories]


@router.get("/categories/{category_id}", response_model=CategoryWithSubcategories)
def get_category(category_id: int, db: Session = Depends(get_db_session)):
    svc = CategoryService(db)
    try:
        category = svc.get_category_by_id(category_id)
    except CategoryError as e:
        raise HTTPException(status_code=404, detail=str(e))
    subcategories = svc.get_subcategories(category_id)
    result = CategoryWithSubcategories.model_validate(category)
    result.subcategories = [SubcategoryResponse.model_validate(s) for s in subcategories]
    return result


@router.get("/categories/{category_id}/subcategories", response_model=list[SubcategoryResponse])
def list_subcategories(category_id: int, db: Session = Depends(get_db_session)):
    svc = CategoryService(db)
    try:
        subs = svc.get_subcategories(category_id)
    except CategoryError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return [SubcategoryResponse.model_validate(s) for s in subs]
