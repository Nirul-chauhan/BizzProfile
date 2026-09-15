"""add is_featured and featured_order to biz_profiles

Revision ID: h1i2j3k4l5m6
Revises: g1h2i3j4k5l6
Create Date: 2026-09-12

"""
from alembic import op
import sqlalchemy as sa

revision = "h1i2j3k4l5m6"
down_revision = "g1h2i3j4k5l6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "biz_profiles",
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "biz_profiles",
        sa.Column("featured_order", sa.Integer(), nullable=True, server_default="0"),
    )
    op.create_index("ix_biz_profiles_is_featured", "biz_profiles", ["is_featured"])
    op.create_index("ix_biz_profiles_featured_order", "biz_profiles", ["featured_order"])


def downgrade() -> None:
    op.drop_index("ix_biz_profiles_featured_order", table_name="biz_profiles")
    op.drop_index("ix_biz_profiles_is_featured", table_name="biz_profiles")
    op.drop_column("biz_profiles", "featured_order")
    op.drop_column("biz_profiles", "is_featured")
