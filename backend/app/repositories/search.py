import math
from dataclasses import dataclass

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.biz_profile import BizProfile
from app.models.category import Category, Subcategory


EARTH_RADIUS_KM = 6371.0


@dataclass
class SearchResult:
    profile: BizProfile
    distance_km: float | None = None
    category_name: str | None = None
    subcategory_name: str | None = None


class SearchRepository:
    """Repository for profile search queries."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def _haversine_distance(self, lat: float, lng: float, lat_col, lng_col):
        """Haversine distance in km as a SQL expression."""
        lat_rad = func.radians(lat)
        dlat = func.radians(lat_col) - lat_rad
        dlng = func.radians(lng_col) - func.radians(lng)
        a = func.power(func.sin(dlat / 2), 2) + func.cos(lat_rad) * func.cos(
            func.radians(lat_col)
        ) * func.power(func.sin(dlng / 2), 2)
        return 2 * EARTH_RADIUS_KM * func.asin(func.sqrt(a))

    def _apply_keyword_filter(self, query, q: str):
        """Apply keyword search across business_name, description, category,
        subcategory, city, state, and pincode."""
        pattern = f"%{q}%"
        return query.where(
            or_(
                BizProfile.business_name.ilike(pattern),
                BizProfile.description.ilike(pattern),
                BizProfile.city.ilike(pattern),
                BizProfile.state.ilike(pattern),
                BizProfile.pincode.ilike(pattern),
                Category.name.ilike(pattern),
                Subcategory.name.ilike(pattern),
            )
        )

    def _apply_filters(
        self,
        query,
        *,
        category_id: int | None = None,
        subcategory_id: int | None = None,
        profile_type: str | None = None,
        city: str | None = None,
        state: str | None = None,
        country: str | None = None,
        pincode: str | None = None,
    ):
        """Apply exact-match filters."""
        if category_id is not None:
            query = query.where(BizProfile.category_id == category_id)
        if subcategory_id is not None:
            query = query.where(BizProfile.subcategory_id == subcategory_id)
        if profile_type is not None:
            query = query.where(BizProfile.profile_type == profile_type)
        if city is not None:
            query = query.where(BizProfile.city.ilike(f"%{city}%"))
        if state is not None:
            query = query.where(BizProfile.state.ilike(f"%{state}%"))
        if country is not None:
            query = query.where(BizProfile.country.ilike(f"%{country}%"))
        if pincode is not None:
            query = query.where(BizProfile.pincode == pincode)
        return query

    def search(
        self,
        *,
        q: str | None = None,
        category_id: int | None = None,
        subcategory_id: int | None = None,
        profile_type: str | None = None,
        city: str | None = None,
        state: str | None = None,
        country: str | None = None,
        pincode: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
        radius_km: float | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[SearchResult], int]:
        """Search profiles with keyword, filters, and optional nearby.

        Returns (results, total_count).
        """
        has_location = (
            latitude is not None and longitude is not None and radius_km is not None
        )

        cat_name = Category.name.label("category_name")
        sub_name = Subcategory.name.label("subcategory_name")

        if has_location:
            distance_expr = self._haversine_distance(
                latitude, longitude, BizProfile.latitude, BizProfile.longitude
            ).label("distance_km")

            query = (
                select(BizProfile, distance_expr, cat_name, sub_name)
                .join(Category, BizProfile.category_id == Category.id, isouter=True)
                .join(
                    Subcategory,
                    BizProfile.subcategory_id == Subcategory.id,
                    isouter=True,
                )
                .where(BizProfile.is_public.is_(True))
                .where(BizProfile.is_active.is_(True))
                .where(BizProfile.latitude.isnot(None))
                .where(BizProfile.longitude.isnot(None))
                .where(distance_expr <= radius_km)
            )
        else:
            distance_expr = None
            query = (
                select(BizProfile, cat_name, sub_name)
                .join(Category, BizProfile.category_id == Category.id, isouter=True)
                .join(
                    Subcategory,
                    BizProfile.subcategory_id == Subcategory.id,
                    isouter=True,
                )
                .where(BizProfile.is_public.is_(True))
                .where(BizProfile.is_active.is_(True))
            )

        if q:
            query = self._apply_keyword_filter(query, q)

        query = self._apply_filters(
            query,
            category_id=category_id,
            subcategory_id=subcategory_id,
            profile_type=profile_type,
            city=city,
            state=state,
            country=country,
            pincode=pincode,
        )

        count_query = select(func.count()).select_from(query.subquery())
        total = self.db.execute(count_query).scalar() or 0

        if distance_expr is not None:
            query = query.order_by(distance_expr)
        else:
            query = query.order_by(BizProfile.created_at.desc())

        offset = (page - 1) * page_size
        rows = self.db.execute(query.offset(offset).limit(page_size)).all()

        results = []
        for row in rows:
            if has_location:
                profile = row[0]
                dist = round(row[1], 2)
                cat_n = row[2]
                sub_n = row[3]
                results.append(SearchResult(profile=profile, distance_km=dist, category_name=cat_n, subcategory_name=sub_n))
            else:
                results.append(SearchResult(profile=row[0], category_name=row[1], subcategory_name=row[2]))

        return results, total
