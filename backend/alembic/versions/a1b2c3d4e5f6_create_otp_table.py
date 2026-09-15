"""create otp table

Revision ID: a1b2c3d4e5f6
Revises: 5b21d21906b3
Create Date: 2026-09-08 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c03bb0044051'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'otps',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('destination', sa.String(length=255), nullable=False),
        sa.Column('otp_hash', sa.String(length=255), nullable=False),
        sa.Column('purpose', sa.String(length=30), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('attempt_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_otps_destination', 'otps', ['destination'])
    op.create_index('ix_otps_purpose', 'otps', ['purpose'])
    op.create_index('ix_otps_user_id', 'otps', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_otps_user_id', table_name='otps')
    op.drop_index('ix_otps_purpose', table_name='otps')
    op.drop_index('ix_otps_destination', table_name='otps')
    op.drop_table('otps')
