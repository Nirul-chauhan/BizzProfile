from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.dependencies.database import get_db_session
from app.models.biz_profile import (
    BizProfile,
    CompanyProfile,
    IndividualProfile,
    MsmProfile,
)
from app.models.category import Category, Subcategory
from app.models.social_link import SocialLink
from app.schemas.biz_profile import PublicBizProfileResponse

router = APIRouter(prefix="/api/public/profiles", tags=["public profiles"])


def _serialize_public_profile(profile: BizProfile) -> dict:
    data = {
        "id": profile.id,
        "business_name": profile.business_name,
        "slug": profile.slug,
        "description": profile.description,
        "profile_type": profile.profile_type,
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
        "is_verified": profile.is_verified,
        "created_at": profile.created_at,
        "category": {
            "id": profile.category.id,
            "name": profile.category.name,
            "slug": profile.category.slug,
        },
        "subcategory": None,
        "social_links": [
            {"platform": sl.platform, "url": sl.url}
            for sl in profile.social_links
        ],
        "company_detail": None,
        "individual_detail": None,
        "msme_detail": None,
    }

    if profile.subcategory:
        data["subcategory"] = {
            "id": profile.subcategory.id,
            "name": profile.subcategory.name,
            "slug": profile.subcategory.slug,
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


@router.get("/{slug}", response_model=PublicBizProfileResponse)
def get_public_profile(
    slug: str,
    db: Session = Depends(get_db_session),
):
    profile = db.execute(
        select(BizProfile)
        .options(
            joinedload(BizProfile.category.of_type(Category)),
            joinedload(BizProfile.subcategory.of_type(Subcategory)),
            joinedload(BizProfile.social_links.of_type(SocialLink)),
            joinedload(BizProfile.company_detail.of_type(CompanyProfile)),
            joinedload(BizProfile.individual_detail.of_type(IndividualProfile)),
            joinedload(BizProfile.msme_detail.of_type(MsmProfile)),
        )
        .where(BizProfile.slug == slug)
    ).scalars().first()

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )

    if not profile.is_public or not profile.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )

    return PublicBizProfileResponse.model_validate(_serialize_public_profile(profile))
