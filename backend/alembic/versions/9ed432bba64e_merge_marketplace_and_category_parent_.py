"""merge marketplace and category parent_id heads

Revision ID: 9ed432bba64e
Revises: 7b7a496170fc, k1l2m3n4o5p6
Create Date: 2026-09-18 09:09:46.286166

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '9ed432bba64e'
down_revision: Union[str, None] = ('7b7a496170fc', 'k1l2m3n4o5p6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
