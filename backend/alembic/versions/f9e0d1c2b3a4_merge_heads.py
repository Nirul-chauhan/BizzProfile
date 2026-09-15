"""merge documents and otp rename heads

Revision ID: f9e0d1c2b3a4
Revises: a1b2c3d4e5f7, e7f8a9b0c1d2
Create Date: 2026-09-09 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f9e0d1c2b3a4'
down_revision: Union[str, None] = ('a1b2c3d4e5f7', 'e7f8a9b0c1d2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
