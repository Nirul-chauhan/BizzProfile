import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies.database import get_db_session
from app.repositories.location import LocationRepository
from app.schemas.nearby import NearbyProfileItem, NearbyResponse

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


def _serialize_profile(profile) -> dict:
    return {
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
    }


@router.get("/nearby", response_model=NearbyResponse)
def get_nearby_profiles(
    latitude: float = Query(..., ge=-90, le=90, description="User latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="User longitude"),
    radius_km: float = Query(default=10.0, gt=0, le=100, description="Search radius in km"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db_session),
):
    repo = LocationRepository(db)
    results, total = repo.find_nearby(
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        page=page,
        page_size=page_size,
    )

    items = []
    for result in results:
        data = _serialize_profile(result.profile)
        data["distance_km"] = result.distance_km
        items.append(NearbyProfileItem.model_validate(data))

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return NearbyResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        results=items,
    )
