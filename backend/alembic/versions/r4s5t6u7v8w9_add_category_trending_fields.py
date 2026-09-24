"""add is_trending and trending_order to categories

Revision ID: r4s5t6u7v8w9
Revises: q1r2s3t4u5v6
Create Date: 2026-09-20
"""
from alembic import op
import sqlalchemy as sa

revision = "r4s5t6u7v8w9"
down_revision = "q1r2s3t4u5v6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("categories", sa.Column("is_trending", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("categories", sa.Column("trending_order", sa.Integer(), nullable=False, server_default="0"))
    op.create_index("ix_categories_is_trending", "categories", ["is_trending"])


def downgrade() -> None:
    op.drop_index("ix_categories_is_trending", table_name="categories")
    op.drop_column("categories", "trending_order")
    op.drop_column("categories", "is_trending")
