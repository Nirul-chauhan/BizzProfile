"""add city state country to users

Revision ID: g1h2i3j4k5l6
Revises: f9e0d1c2b3a4
Create Date: 2026-09-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'g1h2i3j4k5l6'
down_revision: Union[str, None] = 'f9e0d1c2b3a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('city', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('state', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('country', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'country')
    op.drop_column('users', 'state')
    op.drop_column('users', 'city')
