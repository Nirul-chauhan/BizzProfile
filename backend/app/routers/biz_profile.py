from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user, require_user
from app.dependencies.database import get_db_session
from app.models.user import User
from app.schemas.biz_profile import BizProfileCreate, BizProfileResponse, BizProfileUpdate
from app.services.biz_profile import BizProfileError, BizProfileService

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


def _serialize_profile(profile) -> dict:
    data = {
        "id": profile.id,
        "user_id": profile.user_id,
        "category_id": profile.category_id,
        "subcategory_id": profile.subcategory_id,
        "profile_type": profile.profile_type,
        "business_name": profile.business_name,
        "slug": profile.slug,
        "description": profile.description,
        "phone": profile.phone,
        "email": profile.email,
        "website": profile.website,
        "address": profile.address,
        "city": profile.city,
        "state": profile.state,
        "country": profile.country,
        "pincode": profile.pincode,
        "latitude": profile.latitude,
        "longitude": profile.longitude,
        "logo_url": profile.logo_url,
        "cover_image_url": profile.cover_image_url,
        "is_public": profile.is_public,
        "is_verified": profile.is_verified,
        "is_active": profile.is_active,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at,
        "company_detail": None,
        "individual_detail": None,
        "msme_detail": None,
    }

    if profile.profile_type == "COMPANY" and profile.company_detail:
        d = profile.company_detail
        data["company_detail"] = {
            "company_registration_number": d.company_registration_number,
            "legal_name": d.legal_name,
            "company_type": d.company_type,
        }
    elif profile.profile_type == "INDIVIDUAL" and profile.individual_detail:
        d = profile.individual_detail
        data["individual_detail"] = {
            "professional_name": d.professional_name,
            "profession": d.profession,
            "experience_years": d.experience_years,
            "services": d.services,
        }
    elif profile.profile_type == "MSME" and profile.msme_detail:
        d = profile.msme_detail
        data["msme_detail"] = {
            "msme_number": d.msme_number,
            "business_type": d.business_type,
            "industry": d.industry,
        }

    return data


@router.post("", response_model=BizProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(
    request: BizProfileCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    svc = BizProfileService(db)
    try:
        profile = svc.create(
            user_id=current_user.id,
            category_id=request.category_id,
            subcategory_id=request.subcategory_id,
            profile_type=request.profile_type,
            business_name=request.business_name,
            slug=request.slug,
            description=request.description,
            phone=request.phone,
            email=request.email,
            website=request.website,
            address=request.address,
            city=request.city,
            state=request.state,
            country=request.country,
            pincode=request.pincode,
            latitude=request.latitude,
            longitude=request.longitude,
            logo_url=request.logo_url,
            cover_image_url=request.cover_image_url,
            is_public=request.is_public,
            company_detail=request.company_detail.model_dump() if request.company_detail else None,
            individual_detail=request.individual_detail.model_dump() if request.individual_detail else None,
            msme_detail=request.msme_detail.model_dump() if request.msme_detail else None,
        )
    except BizProfileError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return BizProfileResponse.model_validate(_serialize_profile(profile))


@router.get("/my", response_model=list[BizProfileResponse])
def get_my_profiles(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    svc = BizProfileService(db)
    profiles = svc.get_my_profiles(current_user.id)
    return [BizProfileResponse.model_validate(_serialize_profile(p)) for p in profiles]


@router.get("/{profile_id}", response_model=BizProfileResponse)
def get_profile(
    profile_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    svc = BizProfileService(db)
    try:
        profile = svc.get_by_id(profile_id)
    except BizProfileError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    if not profile.is_public and profile.user_id != current_user.id:
        if current_user.role.name != "ADMIN":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Profile is private.")

    return BizProfileResponse.model_validate(_serialize_profile(profile))


@router.put("/{profile_id}", response_model=BizProfileResponse)
def update_profile(
    profile_id: int,
    request: BizProfileUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    svc = BizProfileService(db)
    is_admin = current_user.role.name == "ADMIN"
    update_data = request.model_dump(exclude_unset=True)

    detail_fields = ["company_detail", "individual_detail", "msme_detail"]
    detail_kwargs = {}
    for field in detail_fields:
        if field in update_data:
            detail_kwargs[field] = update_data.pop(field).model_dump() if update_data[field] is not None else None

    try:
        profile = svc.update(
            profile_id=profile_id,
            user_id=current_user.id,
            is_admin=is_admin,
            company_detail=detail_kwargs.get("company_detail"),
            individual_detail=detail_kwargs.get("individual_detail"),
            msme_detail=detail_kwargs.get("msme_detail"),
            **update_data,
        )
    except BizProfileError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return BizProfileResponse.model_validate(_serialize_profile(profile))


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(
    profile_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    svc = BizProfileService(db)
    is_admin = current_user.role.name == "ADMIN"
    try:
        svc.delete(profile_id=profile_id, user_id=current_user.id, is_admin=is_admin)
    except BizProfileError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
