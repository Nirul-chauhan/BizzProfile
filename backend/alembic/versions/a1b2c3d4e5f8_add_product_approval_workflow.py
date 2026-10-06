"""add product approval workflow and service review audit columns

Revision ID: a1b2c3d4e5f8
Revises: z9a8b7c6d5e4
Create Date: 2026-01-15
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f8"
down_revision: Union[str, None] = "z9a8b7c6d5e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---- products: approval workflow + explicit seller owner -------------
    op.add_column(
        "products",
        sa.Column(
            "approval_status",
            sa.String(length=20),
            nullable=False,
            server_default="PENDING",
        ),
    )
    op.add_column("products", sa.Column("rejection_reason", sa.Text(), nullable=True))
    op.add_column("products", sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("products", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "products",
        sa.Column("reviewed_by_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("added_by_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
    )
    op.create_index("ix_products_approval_status", "products", ["approval_status"])

    # Backfill: every product that already existed was created through the
    # legacy flow and is live on the marketplace, so grandfather it as approved
    # and attribute it to the seller who owns the business profile.
    op.execute(
        """
        UPDATE products p
        SET approval_status = 'APPROVED',
            added_by_user_id = bp.user_id,
            submitted_at = p.created_at
        FROM biz_profiles bp
        WHERE bp.id = p.profile_id
        """
    )

    # ---- biz_services: review audit trail -------------------------------
    op.add_column("biz_services", sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("biz_services", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "biz_services",
        sa.Column("reviewed_by_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
    )
    # New services must enter the admin review queue instead of going live
    # unreviewed. Existing rows are already APPROVED and are left untouched.
    op.alter_column(
        "biz_services",
        "approval_status",
        server_default=sa.text("'PENDING'"),
        existing_type=sa.String(length=20),
        existing_nullable=False,
    )
    op.execute(
        """
        UPDATE biz_services s
        SET submitted_at = s.created_at
        FROM biz_profiles bp
        WHERE bp.id = s.profile_id
        """
    )


def downgrade() -> None:
    op.alter_column(
        "biz_services",
        "approval_status",
        server_default=sa.text("'APPROVED'"),
        existing_type=sa.String(length=20),
        existing_nullable=False,
    )
    op.drop_column("biz_services", "reviewed_by_user_id")
    op.drop_column("biz_services", "reviewed_at")
    op.drop_column("biz_services", "submitted_at")

    op.drop_index("ix_products_approval_status", table_name="products")
    op.drop_column("products", "added_by_user_id")
    op.drop_column("products", "reviewed_by_user_id")
    op.drop_column("products", "reviewed_at")
    op.drop_column("products", "submitted_at")
    op.drop_column("products", "rejection_reason")
    op.drop_column("products", "approval_status")
