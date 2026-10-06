from dataclasses import dataclass
from typing import Any, Optional

from sqlalchemy import func, literal_column, select
from sqlalchemy.orm import Session
from sqlalchemy.types import UserDefinedType

from app.models.biz_profile import BizProfile

EARTH_RADIUS_KM = 6371.0
# WGS84 — the datum every browser geolocation API and mapping service returns.
WGS84 = 4326


class Geography(UserDefinedType):
    """PostGIS point type.

    Needed so a cast target is a real SQLAlchemy type. Passing the string
    "geography" to `.cast()` embeds a bare `str` in the expression tree, which
    breaks SQLAlchemy's statement-cache key generation.
    """

    cache_ok = True

    def get_col_spec(self, **kw) -> str:
        return "geography(Point, 4326)"


@dataclass(frozen=True)
class GeoRef:
    """The columns that together express where a row is.

    `location` is the PostGIS geography point. It is a *generated* column owned
    by the database, so it is referenced by name rather than mapped on the ORM
    model: SQLAlchemy would otherwise try to INSERT into a column PostgreSQL
    forbids writing to, and would try to create it on SQLite, which has no
    spatial types. It is `None` on dialects without PostGIS.

    `latitude`/`longitude` are the scalar columns the application actually
    writes, and are what the non-PostGIS fallback measures from.
    """

    location: Optional[Any]
    latitude: Any
    longitude: Any

    def or_(self, fallback: "GeoRef") -> "GeoRef":
        """Use this row's position, falling back to another's when it has none.

        This is how a service with no coordinates of its own is located at the
        business providing it: prefer the service's own point, and borrow the
        business's only when the service has none. Nothing is invented — if
        neither has a position the result stays NULL and the row is hidden.
        """
        return GeoRef(
            location=_coalesce(self.location, fallback.location),
            latitude=func.coalesce(self.latitude, fallback.latitude),
            longitude=func.coalesce(self.longitude, fallback.longitude),
        )


def _coalesce(a: Optional[Any], b: Optional[Any]) -> Optional[Any]:
    """SQL COALESCE that tolerates the absent PostGIS column."""
    if a is None:
        return b
    if b is None:
        return a
    return func.coalesce(a, b)


@dataclass
class NearbyResult:
    profile: BizProfile
    distance_km: float


class LocationRepository:
    """Repository for location-based queries.

    On PostgreSQL the maths runs in PostGIS against the generated `location`
    geography column, so `ST_DWithin` is answered from a GiST index instead of
    computing a distance for every row. On other dialects (the test suite runs
    SQLite) it falls back to an equivalent Haversine expression — the same
    numbers, just without the index.
    """

    def __init__(self, db: Session) -> None:
        self.db = db
        self._use_postgis = db.bind is not None and db.bind.dialect.name == "postgresql"

    # -- Column sets for the tables that carry coordinates ----------------

    def ref_for(self, table_name: str, model) -> GeoRef:
        """Build the location columns for a table that stores lat/lng."""
        location = literal_column(f"{table_name}.location") if self._use_postgis else None
        return GeoRef(location, model.latitude, model.longitude)

    def profile_ref(self) -> GeoRef:
        return self.ref_for("biz_profiles", BizProfile)

    # -- Expressions ------------------------------------------------------

    def _reference_point(self, lat: float, lng: float):
        """The buyer's own position, as a geography value."""
        return func.ST_SetSRID(func.ST_MakePoint(lng, lat), WGS84).cast(Geography)

    def _haversine(self, lat: float, lng: float, lat_col, lng_col):
        """Great-circle distance in km, portable across dialects."""
        lat_rad = func.radians(lat)
        lng_rad = func.radians(lng)
        dlat = func.radians(lat_col) - lat_rad
        dlng = func.radians(lng_col) - lng_rad
        a = func.power(func.sin(dlat / 2), 2) + func.cos(lat_rad) * func.cos(
            func.radians(lat_col)
        ) * func.power(func.sin(dlng / 2), 2)
        return 2 * EARTH_RADIUS_KM * func.asin(func.sqrt(a))

    def distance_km(self, lat: float, lng: float, ref: GeoRef):
        """Great-circle distance in km from the given point to each row."""
        if self._use_postgis:
            return func.ST_Distance(ref.location, self._reference_point(lat, lng)) / 1000.0
        return self._haversine(lat, lng, ref.latitude, ref.longitude)

    def within_radius(self, lat: float, lng: float, ref: GeoRef, radius_km: float):
        """Predicate: row is within `radius_km` of the point.

        `ST_DWithin` lets the GiST index discard far-away rows before any exact
        distance is computed; the Haversine comparison cannot skip that work.
        """
        if self._use_postgis:
            return func.ST_DWithin(
                ref.location, self._reference_point(lat, lng), radius_km * 1000.0
            )
        return self._haversine(lat, lng, ref.latitude, ref.longitude) <= radius_km

    def has_location(self, ref: GeoRef):
        """Predicate: this row has a usable position.

        A row without coordinates must never be treated as sitting at (0, 0) —
        that is a real point in the Gulf of Guinea and would otherwise surface
        in every buyer's results.
        """
        if self._use_postgis:
            return ref.location.isnot(None)
        return ref.latitude.isnot(None) & ref.longitude.isnot(None)

    # -- Queries ----------------------------------------------------------

    def find_nearby(
        self,
        latitude: float,
        longitude: float,
        radius_km: float,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[NearbyResult], int]:
        """Find public, active, verified profiles within radius_km of the point.

        Returns (results, total_count) sorted by distance ascending.
        """
        ref = self.profile_ref()
        distance = self.distance_km(latitude, longitude, ref).label("distance_km")

        base_query = (
            select(BizProfile, distance)
            .where(BizProfile.is_public.is_(True))
            .where(BizProfile.is_active.is_(True))
            .where(BizProfile.is_verified.is_(True))
            .where(self.has_location(ref))
            .where(self.within_radius(latitude, longitude, ref, radius_km))
        )

        total = self.db.execute(
            select(func.count()).select_from(base_query.subquery())
        ).scalar() or 0

        offset = (page - 1) * page_size
        rows = self.db.execute(
            base_query.order_by(distance).offset(offset).limit(page_size)
        ).all()

        return [
            NearbyResult(profile=row[0], distance_km=round(row[1], 2)) for row in rows
        ], total
