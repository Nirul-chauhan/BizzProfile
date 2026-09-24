"""create service listings tables

Revision ID: x2y3z4a5b6c7
Revises: w1x2y3z4a5b6
Create Date: 2026-09-21
"""
from alembic import op
import sqlalchemy as sa

revision = "x2y3z4a5b6c7"
down_revision = "w1x2y3z4a5b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "service_categories",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(150), nullable=False, unique=True),
        sa.Column("slug", sa.String(150), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(50), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("color", sa.String(20), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "service_subcategories",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("service_categories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("slug", sa.String(150), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(50), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_service_subcat_category", "service_subcategories", ["category_id"])
    op.create_index("ix_service_subcat_slug", "service_subcategories", ["slug"], unique=True)

    op.create_table(
        "service_listings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(250), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("full_details", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("service_categories.id"), nullable=False),
        sa.Column("subcategory_id", sa.Integer(), sa.ForeignKey("service_subcategories.id"), nullable=True),
        sa.Column("provider_name", sa.String(200), nullable=True),
        sa.Column("contact_number", sa.String(20), nullable=True),
        sa.Column("price", sa.Float(), nullable=True),
        sa.Column("price_unit", sa.String(50), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("state", sa.String(100), nullable=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("service_radius_km", sa.Float(), nullable=True),
        sa.Column("society_name", sa.String(200), nullable=True),
        sa.Column("profile_id", sa.Integer(), sa.ForeignKey("biz_profiles.id"), nullable=True),
        sa.Column("added_by_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("approval_status", sa.String(20), server_default="PENDING"),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("is_featured", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("featured_order", sa.Integer(), server_default=sa.text("0")),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0")),
        sa.Column("view_count", sa.Integer(), server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_service_listing_category", "service_listings", ["category_id"])
    op.create_index("ix_service_listing_subcategory", "service_listings", ["subcategory_id"])
    op.create_index("ix_service_listing_user", "service_listings", ["added_by_user_id"])
    op.create_index("ix_service_listing_slug", "service_listings", ["slug"], unique=True)
    op.create_index("ix_service_listing_approval", "service_listings", ["approval_status"])


def downgrade() -> None:
    op.drop_table("service_listings")
    op.drop_table("service_subcategories")
    op.drop_table("service_categories")
