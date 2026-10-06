"""add PostGIS geography columns and spatial indexes

Revision ID: b2c3d4e5f6a8
Revises: 9df2217ef0cc
Create Date: 2026-02-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b2c3d4e5f6a8"
down_revision: Union[str, None] = "9df2217ef0cc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Tables that carry their own latitude/longitude pair. `location` is a
# GENERATED column so the point is derived by PostgreSQL from the two scalar
# columns and can never drift out of sync with them.
GEO_TABLES = ("biz_profiles", "biz_services", "service_listings")


def _is_postgis() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def upgrade() -> None:
    if not _is_postgis():
        # SQLite has no spatial types. The query layer falls back to a Haversine
        # expression, so there is nothing to add here.
        return

    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    for table in GEO_TABLES:
        # STORED generated column: lat/lng remain the single source of truth
        # that the application writes, and this derives the indexable point.
        # The CASE keeps the point NULL when either coordinate is missing, so a
        # half-filled row can never land at (0, 0) in the Gulf of Guinea.
        op.execute(
            f"""
            ALTER TABLE {table}
            ADD COLUMN IF NOT EXISTS location geography(Point, 4326)
            GENERATED ALWAYS AS (
                CASE
                    WHEN latitude IS NULL OR longitude IS NULL THEN NULL
                    ELSE ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
                END
            ) STORED
            """
        )
        # GiST lets ST_DWithin answer from the index instead of computing the
        # distance for every row in the table.
        op.execute(
            f"CREATE INDEX IF NOT EXISTS ix_{table}_location_gist "
            f"ON {table} USING GIST (location)"
        )

    # Existing rows are populated automatically by the generated column, so the
    # only backfill needed is confirming nothing was invented: rows that never
    # had coordinates still have a NULL point and stay invisible to Nearby.


def downgrade() -> None:
    if not _is_postgis():
        return

    for table in GEO_TABLES:
        op.execute(f"DROP INDEX IF EXISTS ix_{table}_location_gist")
        op.execute(f"ALTER TABLE {table} DROP COLUMN IF EXISTS location")
