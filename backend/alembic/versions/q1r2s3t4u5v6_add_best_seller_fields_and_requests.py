"""add best_seller fields and best_seller_requests table

Revision ID: q1r2s3t4u5v6
Revises: p4q5r6s7t8u9
Create Date: 2026-09-20
"""
from alembic import op
import sqlalchemy as sa

revision = "q1r2s3t4u5v6"
down_revision = "p4q5r6s7t8u9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_best_seller and best_seller_order to products table
    op.add_column("products", sa.Column("is_best_seller", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("products", sa.Column("best_seller_order", sa.Integer(), nullable=False, server_default="0"))
    op.create_index("ix_products_is_best_seller", "products", ["is_best_seller"])

    # Create best_seller_requests table
    op.create_table(
        "best_seller_requests",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("buyer_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_best_seller_requests_buyer_id", "best_seller_requests", ["buyer_id"])
    op.create_index("ix_best_seller_requests_product_id", "best_seller_requests", ["product_id"])
    op.create_index("ix_best_seller_requests_status", "best_seller_requests", ["status"])


def downgrade() -> None:
    op.drop_table("best_seller_requests")
    op.drop_index("ix_products_is_best_seller", table_name="products")
    op.drop_column("products", "best_seller_order")
    op.drop_column("products", "is_best_seller")
