from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user, require_user
from app.dependencies.database import get_db_session
from app.models.user import User
from app.schemas.social_link import SocialLinkCreate, SocialLinkResponse, SocialLinkUpdate
from app.services.social_link import SocialLinkError, SocialLinkService

router = APIRouter(prefix="/api/profiles", tags=["social-links"])


@router.post(
    "/{profile_id}/social-links",
    response_model=SocialLinkResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_social_link(
    profile_id: int,
    request: SocialLinkCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    svc = SocialLinkService(db)
    is_admin = current_user.role.name == "ADMIN"
    try:
        link = svc.create(
            profile_id=profile_id,
            platform=request.platform,
            url=request.url,
            user_id=current_user.id,
            is_admin=is_admin,
        )
    except SocialLinkError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return SocialLinkResponse.model_validate(link)


@router.get(
    "/{profile_id}/social-links",
    response_model=list[SocialLinkResponse],
)
def get_social_links(
    profile_id: int,
    db: Session = Depends(get_db_session),
    _current_user: User = Depends(get_current_user),
):
    svc = SocialLinkService(db)
    try:
        links = svc.get_by_profile(profile_id)
    except SocialLinkError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return [SocialLinkResponse.model_validate(link) for link in links]


social_links_router = APIRouter(prefix="/api/social-links", tags=["social-links"])


@social_links_router.put(
    "/{social_link_id}",
    response_model=SocialLinkResponse,
)
def update_social_link(
    social_link_id: int,
    request: SocialLinkUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    svc = SocialLinkService(db)
    is_admin = current_user.role.name == "ADMIN"
    try:
        link = svc.update(
            social_link_id=social_link_id,
            url=request.url,
            user_id=current_user.id,
            is_admin=is_admin,
        )
    except SocialLinkError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return SocialLinkResponse.model_validate(link)


@social_links_router.delete(
    "/{social_link_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_social_link(
    social_link_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    svc = SocialLinkService(db)
    is_admin = current_user.role.name == "ADMIN"
    try:
        svc.delete(
            social_link_id=social_link_id,
            user_id=current_user.id,
            is_admin=is_admin,
        )
    except SocialLinkError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
