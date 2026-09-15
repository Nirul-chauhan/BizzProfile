"""create profile type child tables

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-08

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- company_profiles ---
    op.create_table(
        "company_profiles",
        sa.Column("biz_profile_id", sa.Integer(), sa.ForeignKey("biz_profiles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("company_registration_number", sa.String(100), nullable=True),
        sa.Column("legal_name", sa.String(255), nullable=True),
        sa.Column("company_type", sa.String(100), nullable=True),
    )

    # --- individual_profiles ---
    op.create_table(
        "individual_profiles",
        sa.Column("biz_profile_id", sa.Integer(), sa.ForeignKey("biz_profiles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("professional_name", sa.String(255), nullable=True),
        sa.Column("profession", sa.String(100), nullable=True),
        sa.Column("experience_years", sa.Integer(), nullable=True),
        sa.Column("services", sa.Text(), nullable=True),
    )

    # --- msme_profiles ---
    op.create_table(
        "msme_profiles",
        sa.Column("biz_profile_id", sa.Integer(), sa.ForeignKey("biz_profiles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("msme_number", sa.String(100), nullable=True),
        sa.Column("business_type", sa.String(100), nullable=True),
        sa.Column("industry", sa.String(100), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("msme_profiles")
    op.drop_table("individual_profiles")
    op.drop_table("company_profiles")
