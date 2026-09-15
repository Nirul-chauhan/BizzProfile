"""add icon logo_url is_popular sort_order to categories

Revision ID: j3k4l5m6n7o8
Revises: i2j3k4l5m6n7
Create Date: 2026-09-12

"""
from alembic import op
import sqlalchemy as sa

revision = "j3k4l5m6n7o8"
down_revision = "i2j3k4l5m6n7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "categories",
        sa.Column("icon", sa.String(50), nullable=True),
    )
    op.add_column(
        "categories",
        sa.Column("logo_url", sa.String(500), nullable=True),
    )
    op.add_column(
        "categories",
        sa.Column("is_popular", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "categories",
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("categories", "sort_order")
    op.drop_column("categories", "is_popular")
    op.drop_column("categories", "logo_url")
    op.drop_column("categories", "icon")
