"""add trending and featured to biz_services

Revision ID: p4q5r6s7t8u9
Revises: o3p4q5r6s7t8
Create Date: 2026-09-19
"""
from alembic import op
import sqlalchemy as sa

revision = "p4q5r6s7t8u9"
down_revision = "o3p4q5r6s7t8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "biz_services",
        sa.Column("is_trending", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "biz_services",
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("biz_services", "is_featured")
    op.drop_column("biz_services", "is_trending")
