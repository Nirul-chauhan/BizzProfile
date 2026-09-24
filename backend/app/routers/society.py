from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user, require_admin
from app.dependencies.database import get_db_session
from app.models.society import Society
from app.models.user import User
from app.schemas.society import SocietyCreate, SocietyResponse, SocietyUpdate

router = APIRouter(prefix="/api/societies", tags=["societies"])


@router.get("", response_model=list[SocietyResponse])
def list_societies(db: Session = Depends(get_db_session)):
    societies = db.execute(select(Society).order_by(Society.name)).scalars().all()
    return [SocietyResponse.model_validate(s) for s in societies]


@router.get("/{society_id}", response_model=SocietyResponse)
def get_society(society_id: int, db: Session = Depends(get_db_session)):
    society = db.get(Society, society_id)
    if not society:
        raise HTTPException(status_code=404, detail="Society not found.")
    return SocietyResponse.model_validate(society)


@router.post("", response_model=SocietyResponse, status_code=status.HTTP_201_CREATED)
def create_society(
    request: SocietyCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    society = Society(**request.model_dump())
    db.add(society)
    db.commit()
    db.refresh(society)
    return SocietyResponse.model_validate(society)


@router.put("/{society_id}", response_model=SocietyResponse)
def update_society(
    society_id: int,
    request: SocietyUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    society = db.get(Society, society_id)
    if not society:
        raise HTTPException(status_code=404, detail="Society not found.")
    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(society, key, value)
    db.commit()
    db.refresh(society)
    return SocietyResponse.model_validate(society)


@router.delete("/{society_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_society(
    society_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    society = db.get(Society, society_id)
    if not society:
        raise HTTPException(status_code=404, detail="Society not found.")
    db.delete(society)
    db.commit()
