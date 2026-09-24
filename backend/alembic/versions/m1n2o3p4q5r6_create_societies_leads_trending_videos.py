"""create societies leads trending_videos tables

Revision ID: m1n2o3p4q5r6
Revises: l2m3n4o5p6q7
Create Date: 2026-09-19
"""
from alembic import op
import sqlalchemy as sa

revision = "m1n2o3p4q5r6"
down_revision = "l2m3n4o5p6q7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # societies
    op.create_table(
        "societies",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("pincode", sa.String(10), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_societies_city", "societies", ["city"])
    op.create_index("ix_societies_pincode", "societies", ["pincode"])

    # add society_id, block_tower, flat_number, is_phone_verified to users
    op.add_column("users", sa.Column("society_id", sa.Integer(), sa.ForeignKey("societies.id"), nullable=True))
    op.add_column("users", sa.Column("block_tower", sa.String(50), nullable=True))
    op.add_column("users", sa.Column("flat_number", sa.String(20), nullable=True))
    op.add_column("users", sa.Column("is_phone_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False))
    op.create_index("ix_users_society_id", "users", ["society_id"])

    # make password_hash nullable for phone-OTP users
    op.alter_column("users", "password_hash", nullable=True)

    # leads
    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("buyer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("phone_to_call", sa.String(20), nullable=True),
        sa.Column("status", sa.String(20), server_default="NEW", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_leads_product_id", "leads", ["product_id"])
    op.create_index("ix_leads_buyer_id", "leads", ["buyer_id"])
    op.create_index("ix_leads_status", "leads", ["status"])

    # trending_videos
    op.create_table(
        "trending_videos",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("platform", sa.String(20), nullable=False),
        sa.Column("video_url", sa.String(500), nullable=False),
        sa.Column("embed_id", sa.String(100), nullable=True),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("added_by_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_trending_videos_is_active", "trending_videos", ["is_active"])
    op.create_index("ix_trending_videos_platform", "trending_videos", ["platform"])


def downgrade() -> None:
    op.drop_table("trending_videos")
    op.drop_table("leads")
    op.drop_index("ix_users_society_id", table_name="users")
    op.drop_column("users", "is_phone_verified")
    op.drop_column("users", "flat_number")
    op.drop_column("users", "block_tower")
    op.drop_column("users", "society_id")
    op.drop_table("societies")
