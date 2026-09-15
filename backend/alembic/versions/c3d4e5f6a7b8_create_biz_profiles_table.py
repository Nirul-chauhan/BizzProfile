"""create biz_profiles table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-09-08 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'biz_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('subcategory_id', sa.Integer(), nullable=True),
        sa.Column('profile_type', sa.String(length=20), nullable=False),
        sa.Column('business_name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('website', sa.String(length=500), nullable=True),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('pincode', sa.String(length=20), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('logo_url', sa.String(length=500), nullable=True),
        sa.Column('cover_image_url', sa.String(length=500), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id']),
        sa.ForeignKeyConstraint(['subcategory_id'], ['subcategories.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug'),
    )
    op.create_index('ix_biz_profiles_business_name', 'biz_profiles', ['business_name'])
    op.create_index('ix_biz_profiles_slug', 'biz_profiles', ['slug'])
    op.create_index('ix_biz_profiles_category_id', 'biz_profiles', ['category_id'])
    op.create_index('ix_biz_profiles_subcategory_id', 'biz_profiles', ['subcategory_id'])
    op.create_index('ix_biz_profiles_city', 'biz_profiles', ['city'])
    op.create_index('ix_biz_profiles_state', 'biz_profiles', ['state'])
    op.create_index('ix_biz_profiles_profile_type', 'biz_profiles', ['profile_type'])
    op.create_index('ix_biz_profiles_latitude', 'biz_profiles', ['latitude'])
    op.create_index('ix_biz_profiles_longitude', 'biz_profiles', ['longitude'])


def downgrade() -> None:
    op.drop_index('ix_biz_profiles_longitude', table_name='biz_profiles')
    op.drop_index('ix_biz_profiles_latitude', table_name='biz_profiles')
    op.drop_index('ix_biz_profiles_profile_type', table_name='biz_profiles')
    op.drop_index('ix_biz_profiles_state', table_name='biz_profiles')
    op.drop_index('ix_biz_profiles_city', table_name='biz_profiles')
    op.drop_index('ix_biz_profiles_subcategory_id', table_name='biz_profiles')
    op.drop_index('ix_biz_profiles_category_id', table_name='biz_profiles')
    op.drop_index('ix_biz_profiles_slug', table_name='biz_profiles')
    op.drop_index('ix_biz_profiles_business_name', table_name='biz_profiles')
    op.drop_table('biz_profiles')
