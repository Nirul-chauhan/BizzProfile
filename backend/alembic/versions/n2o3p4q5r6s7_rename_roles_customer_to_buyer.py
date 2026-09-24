"""rename roles customer->buyer enduser->seller

Revision ID: n2o3p4q5r6s7
Revises: m1n2o3p4q5r6
Create Date: 2026-09-19
"""
from alembic import op
import sqlalchemy as sa

revision = "n2o3p4q5r6s7"
down_revision = "m1n2o3p4q5r6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE roles SET name = 'BUYER' WHERE name = 'CUSTOMER'")
    op.execute("UPDATE roles SET name = 'SELLER' WHERE name = 'ENDUSER'")
    op.execute("UPDATE roles SET description = 'BUYER role' WHERE name = 'BUYER'")
    op.execute("UPDATE roles SET description = 'SELLER role' WHERE name = 'SELLER'")


def downgrade() -> None:
    op.execute("UPDATE roles SET name = 'CUSTOMER' WHERE name = 'BUYER'")
    op.execute("UPDATE roles SET name = 'ENDUSER' WHERE name = 'SELLER'")
    op.execute("UPDATE roles SET description = 'CUSTOMER role' WHERE name = 'CUSTOMER'")
    op.execute("UPDATE roles SET description = 'ENDUSER role' WHERE name = 'ENDUSER'")
