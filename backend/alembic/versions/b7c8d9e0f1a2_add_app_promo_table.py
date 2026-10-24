"""add_app_promo_table

Revision ID: b7c8d9e0f1a2
Revises: cff1b9d3f2c5
Create Date: 2026-10-07 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7c8d9e0f1a2'
down_revision: Union[str, None] = 'cff1b9d3f2c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'app_promo',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('heading', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('qr_code_url', sa.String(length=500), nullable=True),
        sa.Column('google_play_url', sa.String(length=500), nullable=True),
        sa.Column('app_store_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.execute(
        "INSERT INTO app_promo (heading, description, is_active) VALUES ("
        "'Download Our BizzProfile App', "
        "'Search verified businesses, products and services on the go. "
        "Compare quotes, chat with sellers and manage your enquiries - "
        "everything from your phone.', "
        "TRUE)"
    )


def downgrade() -> None:
    op.drop_table('app_promo')
