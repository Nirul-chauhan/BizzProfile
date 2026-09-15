"""rename otp_hash to otp_code

Revision ID: e7f8a9b0c1d2
Revises: a1b2c3d4e5f6
Create Date: 2026-09-09 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7f8a9b0c1d2'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DELETE FROM otps")
    op.alter_column('otps', 'otp_hash', new_column_name='otp_code', type_=sa.String(length=6))


def downgrade() -> None:
    op.alter_column('otps', 'otp_code', new_column_name='otp_hash', type_=sa.String(length=255))
