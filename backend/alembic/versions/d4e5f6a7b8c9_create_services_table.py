"""create services table

Revision ID: d4e5f6a7b8c9
Revises: c1f2a3b4d5e6
Create Date: 2026-11-22 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c1f2a3b4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'services',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=160), nullable=False),
        sa.Column('slug', sa.String(length=180), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price_cop', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint('price_cop >= 0', name='ck_services_price_cop_non_negative'),
        sa.CheckConstraint('duration_minutes IS NULL OR duration_minutes > 0', name='ck_services_duration_minutes_positive'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug', name='uq_services_slug'),
    )
    op.create_index(op.f('ix_services_is_active'), 'services', ['is_active'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_services_is_active'), table_name='services')
    op.drop_table('services')
