"""merge_enquiry_message

Revision ID: ba5ed05c3fbe
Revises: ad9163abe97c, m9n0o1p2q3r4
Create Date: 2026-10-24 12:23:41.666625

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'ba5ed05c3fbe'
down_revision: Union[str, None] = ('ad9163abe97c', 'm9n0o1p2q3r4')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
