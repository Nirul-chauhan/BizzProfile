"""add is_first_login to users

Revision ID: z9a8b7c6d5e4
Revises: x2y3z4a5b6c7
Create Date: 2026-09-22
"""
from alembic import op
import sqlalchemy as sa

revision = "z9a8b7c6d5e4"
down_revision = "x2y3z4a5b6c7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_first_login", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("users", "is_first_login")
