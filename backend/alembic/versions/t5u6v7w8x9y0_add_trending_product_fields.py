"""Add trending product fields and trending_product_requests table

Revision ID: t5u6v7w8x9y0
Revises: q1r2s3t4u5v6
Create Date: 2026-09-20
"""
from alembic import op
import sqlalchemy as sa

revision = "t5u6v7w8x9y0"
down_revision = "q1r2s3t4u5v6"
branch_labels = None
depends_on = None


def upgrade():
    # Add is_trending and trending_order columns to products table
    op.add_column("products", sa.Column("is_trending", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("products", sa.Column("trending_order", sa.Integer(), nullable=False, server_default=sa.text("0")))
    op.create_index("ix_products_is_trending", "products", ["is_trending"])

    # Create trending_product_requests table
    op.create_table(
        "trending_product_requests",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("buyer_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_trending_product_requests_buyer_id", "trending_product_requests", ["buyer_id"])
    op.create_index("ix_trending_product_requests_product_id", "trending_product_requests", ["product_id"])
    op.create_index("ix_trending_product_requests_status", "trending_product_requests", ["status"])


def downgrade():
    op.drop_index("ix_trending_product_requests_status", table_name="trending_product_requests")
    op.drop_index("ix_trending_product_requests_product_id", table_name="trending_product_requests")
    op.drop_index("ix_trending_product_requests_buyer_id", table_name="trending_product_requests")
    op.drop_table("trending_product_requests")
    op.drop_index("ix_products_is_trending", table_name="products")
    op.drop_column("products", "trending_order")
    op.drop_column("products", "is_trending")
