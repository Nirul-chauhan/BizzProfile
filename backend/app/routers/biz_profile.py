from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user, require_user
from app.dependencies.database import get_db_session
from app.models.user import User
from app.schemas.biz_profile import BizProfileCreate, BizProfileResponse, BizProfileUpdate
from app.schemas.seller import SellerBusinessHourCreate, SellerBusinessHourResponse
from app.services.biz_profile import BizProfileError, BizProfileService

IMAGE_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
IMAGE_MAX_SIZE = 5 * 1024 * 1024  # 5 MB

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
        "verification_status": profile.verification_status,
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
            # request.model_dump() flattens nested models into plain dicts, so
            # read the sub-model off the request itself before dumping it.
            value = getattr(request, field, None)
            detail_kwargs[field] = value.model_dump() if value is not None else None
            update_data.pop(field)

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


# ---------------------------------------------------------------------------
# Verification, logo/cover uploads & business hours (per business profile)
# ---------------------------------------------------------------------------


def _error_status(message: str, default: int = 400) -> int:
    lowered = message.lower()
    if "own" in lowered or "permission" in lowered:
        return status.HTTP_403_FORBIDDEN
    if "not found" in lowered:
        return status.HTTP_404_NOT_FOUND
    return default


async def _save_image(file: UploadFile, folder: str) -> str:
    if file.content_type not in IMAGE_ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' is not allowed. Use JPEG, PNG, or WebP.",
        )
    content = await file.read()
    if len(content) > IMAGE_MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum of 5 MB.",
        )
    from app.services.storage import LocalStorageService

    storage = LocalStorageService()
    file_path = storage.save(content, file.filename or "image.jpg", folder=folder)
    return storage.get_url(file_path)


def _load_owned_or_admin(db: Session, profile_id: int, current_user: User):
    svc = BizProfileService(db)
    try:
        profile = svc.get_by_id(profile_id)
    except BizProfileError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    if profile.user_id != current_user.id and current_user.role.name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage your own business profiles.",
        )
    return profile


@router.post("/{profile_id}/submit-verification", response_model=BizProfileResponse)
def submit_verification(
    profile_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    """Seller asks an admin to review this business. Never sets VERIFIED."""
    svc = BizProfileService(db)
    try:
        profile = svc.submit_for_verification(profile_id, current_user.id)
    except BizProfileError as e:
        raise HTTPException(status_code=_error_status(str(e)), detail=str(e))
    return BizProfileResponse.model_validate(_serialize_profile(profile))


@router.post("/{profile_id}/logo", response_model=BizProfileResponse)
async def upload_profile_logo(
    profile_id: int,
    file: UploadFile,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    profile = _load_owned_or_admin(db, profile_id, current_user)
    profile.logo_url = await _save_image(file, "logos")
    db.commit()
    db.refresh(profile)
    return BizProfileResponse.model_validate(_serialize_profile(profile))


@router.post("/{profile_id}/cover", response_model=BizProfileResponse)
async def upload_profile_cover(
    profile_id: int,
    file: UploadFile,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    profile = _load_owned_or_admin(db, profile_id, current_user)
    profile.cover_image_url = await _save_image(file, "covers")
    db.commit()
    db.refresh(profile)
    return BizProfileResponse.model_validate(_serialize_profile(profile))


@router.get(
    "/{profile_id}/business-hours",
    response_model=list[SellerBusinessHourResponse],
)
def list_business_hours(
    profile_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    svc = BizProfileService(db)
    try:
        hours = svc.list_business_hours(profile_id, current_user.id)
    except BizProfileError as e:
        raise HTTPException(status_code=_error_status(str(e)), detail=str(e))
    return [SellerBusinessHourResponse.model_validate(h) for h in hours]


@router.post(
    "/{profile_id}/business-hours/{day_of_week}",
    response_model=SellerBusinessHourResponse,
    status_code=status.HTTP_201_CREATED,
)
def upsert_business_hours(
    profile_id: int,
    day_of_week: int,
    data: SellerBusinessHourCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_user),
):
    svc = BizProfileService(db)
    payload = data.model_dump(exclude={"day_of_week"})
    try:
        hour = svc.upsert_business_hours(
            profile_id, current_user.id, day_of_week, payload
        )
    except BizProfileError as e:
        raise HTTPException(status_code=_error_status(str(e)), detail=str(e))
    return SellerBusinessHourResponse.model_validate(hour)
