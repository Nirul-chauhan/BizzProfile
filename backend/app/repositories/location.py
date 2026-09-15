from dataclasses import dataclass

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.models.biz_profile import BizProfile


EARTH_RADIUS_KM = 6371.0


@dataclass
class NearbyResult:
    profile: BizProfile
    distance_km: float


class LocationRepository:
    """Repository for location-based queries.

    Designed for PostGIS migration: replace _haversine_distance()
    with PostGIS ST_Distance / ST_DWithin for production.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    def _haversine_distance(
        self, lat: float, lng: float, lat_col, lng_col
    ):
        """Compute Haversine distance in km as a SQL expression.

        Works on both PostgreSQL and SQLite (via math functions).
        For PostgreSQL, this uses radians/sin/cos/acos.
        For SQLite, the same math works since SQLAlchemy compiles it.

        To migrate to PostGIS, replace this body with:
            from sqlalchemy_postgis.functions import ST_Distance
            point = func.ST_MakePoint(lng, lat)
            return ST_Distance(func.ST_MakePoint(lng_col, lat_col), point) / 1000.0
        """
        lat_rad = func.radians(lat)
        lng_rad = func.radians(lng)
        dlat = func.radians(lat_col) - lat_rad
        dlng = func.radians(lng_col) - lng_rad
        a = func.power(func.sin(dlat / 2), 2) + func.cos(lat_rad) * func.cos(
            func.radians(lat_col)
        ) * func.power(func.sin(dlng / 2), 2)
        return 2 * EARTH_RADIUS_KM * func.asin(func.sqrt(a))

    def find_nearby(
        self,
        latitude: float,
        longitude: float,
        radius_km: float,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[NearbyResult], int]:
        """Find public, active profiles within radius_km of the given point.

        Returns (results, total_count) sorted by distance ascending.
        """
        distance_expr = self._haversine_distance(
            latitude, longitude, BizProfile.latitude, BizProfile.longitude
        ).label("distance_km")

        base_query = (
            select(BizProfile, distance_expr)
            .where(BizProfile.is_public.is_(True))
            .where(BizProfile.is_active.is_(True))
            .where(BizProfile.is_verified.is_(True))
            .where(BizProfile.latitude.isnot(None))
            .where(BizProfile.longitude.isnot(None))
            .where(distance_expr <= radius_km)
        )

        count_query = select(func.count()).select_from(base_query.subquery())
        total = self.db.execute(count_query).scalar() or 0

        offset = (page - 1) * page_size
        rows = self.db.execute(
            base_query.order_by(distance_expr).offset(offset).limit(page_size)
        ).all()

        results = [
            NearbyResult(profile=row[0], distance_km=round(row[1], 2))
            for row in rows
        ]

        return results, total
