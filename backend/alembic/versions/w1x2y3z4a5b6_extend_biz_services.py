"""Extend biz_services with new fields for Our Services feature.

Revision ID: w1x2y3z4a5b6
Revises: v7w8x9y0z1a2
Create Date: 2026-09-21
"""
from alembic import op
import sqlalchemy as sa

revision = "w1x2y3z4a5b6"
down_revision = "v7w8x9y0z1a2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("biz_services", sa.Column("slug", sa.String(255), nullable=True, unique=True))
    op.add_column("biz_services", sa.Column("image_url", sa.String(500), nullable=True))
    op.add_column("biz_services", sa.Column("contact_phone", sa.String(20), nullable=True))
    op.add_column("biz_services", sa.Column("contact_email", sa.String(255), nullable=True))
    op.add_column("biz_services", sa.Column("address", sa.String(500), nullable=True))
    op.add_column("biz_services", sa.Column("city", sa.String(100), nullable=True))
    op.add_column("biz_services", sa.Column("state", sa.String(100), nullable=True))
    op.add_column("biz_services", sa.Column("country", sa.String(100), nullable=True))
    op.add_column("biz_services", sa.Column("pincode", sa.String(20), nullable=True))
    op.add_column("biz_services", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("biz_services", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column("biz_services", sa.Column("service_radius", sa.Float(), nullable=True))
    op.add_column("biz_services", sa.Column("added_by_user_id", sa.Integer(), nullable=True))
    op.add_column("biz_services", sa.Column("approval_status", sa.String(20), nullable=False, server_default="APPROVED"))
    op.add_column("biz_services", sa.Column("rejection_reason", sa.String(500), nullable=True))
    op.add_column("biz_services", sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("biz_services", sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")))

    op.create_index("ix_biz_services_approval_status", "biz_services", ["approval_status"])

    op.create_foreign_key(
        "fk_biz_services_added_by_user_id",
        "biz_services",
        "users",
        ["added_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_biz_services_added_by_user_id", "biz_services", type_="foreignkey")
    op.drop_index("ix_biz_services_approval_status", table_name="biz_services")
    op.drop_column("biz_services", "sort_order")
    op.drop_column("biz_services", "is_published")
    op.drop_column("biz_services", "rejection_reason")
    op.drop_column("biz_services", "approval_status")
    op.drop_column("biz_services", "added_by_user_id")
    op.drop_column("biz_services", "service_radius")
    op.drop_column("biz_services", "longitude")
    op.drop_column("biz_services", "latitude")
    op.drop_column("biz_services", "pincode")
    op.drop_column("biz_services", "country")
    op.drop_column("biz_services", "state")
    op.drop_column("biz_services", "city")
    op.drop_column("biz_services", "address")
    op.drop_column("biz_services", "contact_email")
    op.drop_column("biz_services", "contact_phone")
    op.drop_column("biz_services", "image_url")
    op.drop_column("biz_services", "slug")
