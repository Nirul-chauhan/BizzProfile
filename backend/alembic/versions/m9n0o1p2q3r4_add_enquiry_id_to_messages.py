"""add enquiry_id to messages

Revision ID: m9n0o1p2q3r4
Revises: x2y3z4a5b6c7
Create Date: 2026-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'm9n0o1p2q3r4'
down_revision = 'x2y3z4a5b6c7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('messages', sa.Column('enquiry_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_messages_enquiry_id', 'messages', 'enquiries', ['enquiry_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_messages_enquiry_id', 'messages', ['enquiry_id'])


def downgrade() -> None:
    op.drop_index('ix_messages_enquiry_id', table_name='messages')
    op.drop_constraint('fk_messages_enquiry_id', 'messages', type_='foreignkey')
    op.drop_column('messages', 'enquiry_id')
