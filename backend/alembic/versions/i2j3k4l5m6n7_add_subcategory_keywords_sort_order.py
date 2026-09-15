"""add keywords sort_order is_trending to subcategories

Revision ID: i2j3k4l5m6n7
Revises: h1i2j3k4l5m6
Create Date: 2026-09-12

"""
from alembic import op
import sqlalchemy as sa

revision = "i2j3k4l5m6n7"
down_revision = "h1i2j3k4l5m6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "subcategories",
        sa.Column("keywords", sa.String(1000), nullable=True),
    )
    op.add_column(
        "subcategories",
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "subcategories",
        sa.Column("is_trending", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("subcategories", "is_trending")
    op.drop_column("subcategories", "sort_order")
    op.drop_column("subcategories", "keywords")
