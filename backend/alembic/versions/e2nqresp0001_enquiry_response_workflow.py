"""enquiry response workflow fields

Revision ID: e2nqresp0001
Revises: c1a25b954d25
Create Date: 2026-11-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e2nqresp0001'
down_revision: Union[str, None] = 'c1a25b954d25'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('enquiries', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column(
        'enquiries',
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column('quotations', sa.Column('item_name', sa.String(length=255), nullable=True))
    op.add_column('quotations', sa.Column('availability', sa.Text(), nullable=True))
    op.add_column('quotations', sa.Column('message', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('quotations', 'message')
    op.drop_column('quotations', 'availability')
    op.drop_column('quotations', 'item_name')
    op.drop_column('enquiries', 'responded_at')
    op.drop_column('enquiries', 'rejection_reason')
