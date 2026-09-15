"""create social links table

Revision ID: f6a7b8c9d0e1
Revises: 457f1e2b1376
Create Date: 2026-09-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = '457f1e2b1376'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'social_links',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('biz_profile_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(length=20), nullable=False),
        sa.Column('url', sa.String(length=500), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['biz_profile_id'], ['biz_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('biz_profile_id', 'platform', name='uq_social_link_profile_platform'),
    )
    op.create_index('ix_social_links_biz_profile_id', 'social_links', ['biz_profile_id'])


def downgrade() -> None:
    op.drop_index('ix_social_links_biz_profile_id', table_name='social_links')
    op.drop_table('social_links')
