"""Extend trending_videos with description, thumbnail, company, category, approval, trending fields

Revision ID: v7w8x9y0z1a2
Revises: u6v7w8x9y0z1
Create Date: 2026-09-21
"""
from alembic import op
import sqlalchemy as sa

revision = "v7w8x9y0z1a2"
down_revision = "u6v7w8x9y0z1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("trending_videos", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("trending_videos", sa.Column("thumbnail_url", sa.String(500), nullable=True))
    op.add_column("trending_videos", sa.Column("company_name", sa.String(255), nullable=True))
    op.add_column("trending_videos", sa.Column("city", sa.String(100), nullable=True))
    op.add_column("trending_videos", sa.Column("state", sa.String(100), nullable=True))
    op.add_column("trending_videos", sa.Column("country", sa.String(100), nullable=True))
    op.add_column("trending_videos", sa.Column("category_id", sa.Integer(), nullable=True))
    op.add_column("trending_videos", sa.Column("profile_id", sa.Integer(), nullable=True))
    op.add_column("trending_videos", sa.Column("approval_status", sa.String(20), nullable=False, server_default="APPROVED"))
    op.add_column("trending_videos", sa.Column("rejection_reason", sa.String(500), nullable=True))
    op.add_column("trending_videos", sa.Column("is_trending", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.create_index("ix_trending_videos_approval_status", "trending_videos", ["approval_status"])
    op.create_foreign_key("fk_trending_videos_category", "trending_videos", "categories", ["category_id"], ["id"])
    op.create_foreign_key("fk_trending_videos_profile", "trending_videos", "biz_profiles", ["profile_id"], ["id"])


def downgrade():
    op.drop_constraint("fk_trending_videos_profile", "trending_videos", type_="foreignkey")
    op.drop_constraint("fk_trending_videos_category", "trending_videos", type_="foreignkey")
    op.drop_index("ix_trending_videos_approval_status", "trending_videos")
    op.drop_column("trending_videos", "is_trending")
    op.drop_column("trending_videos", "rejection_reason")
    op.drop_column("trending_videos", "approval_status")
    op.drop_column("trending_videos", "profile_id")
    op.drop_column("trending_videos", "category_id")
    op.drop_column("trending_videos", "country")
    op.drop_column("trending_videos", "state")
    op.drop_column("trending_videos", "city")
    op.drop_column("trending_videos", "company_name")
    op.drop_column("trending_videos", "thumbnail_url")
    op.drop_column("trending_videos", "description")
