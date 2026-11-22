"""add idempotency scope to orders

Revision ID: c1f2a3b4d5e6
Revises: 81882de8b3e1
Create Date: 2026-11-21 23:59:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = 'c1f2a3b4d5e6'
down_revision: Union[str, Sequence[str], None] = '81882de8b3e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(bind, table: str, column: str) -> bool:
    insp = inspect(bind)
    return any(col['name'] == column for col in insp.get_columns(table))


def _has_unique(bind, table: str, name: str) -> bool:
    insp = inspect(bind)
    return any(uc.get('name') == name for uc in insp.get_unique_constraints(table))


def _has_index(bind, table: str, name: str) -> bool:
    insp = inspect(bind)
    return any(ix.get('name') == name for ix in insp.get_indexes(table))


def upgrade() -> None:
    bind = op.get_bind()

    if not _has_column(bind, 'orders', 'idempotency_scope'):
        op.add_column('orders', sa.Column('idempotency_scope', sa.String(length=128), nullable=True))

    op.execute(
        "UPDATE orders SET idempotency_scope = CASE WHEN user_id IS NOT NULL THEN 'user:' || user_id::text ELSE 'guest:legacy:' || id::text END "
        "WHERE idempotency_key IS NOT NULL AND idempotency_scope IS NULL"
    )

    if _has_unique(bind, 'orders', 'uq_orders_idempotency_key'):
        op.drop_constraint('uq_orders_idempotency_key', 'orders', type_='unique')

    if not _has_index(bind, 'orders', 'ix_orders_idempotency_key'):
        op.create_index('ix_orders_idempotency_key', 'orders', ['idempotency_key'], unique=False)

    if not _has_unique(bind, 'orders', 'uq_orders_idempotency_scope_key'):
        op.create_unique_constraint('uq_orders_idempotency_scope_key', 'orders', ['idempotency_scope', 'idempotency_key'])


def downgrade() -> None:
    bind = op.get_bind()
    if _has_unique(bind, 'orders', 'uq_orders_idempotency_scope_key'):
        op.drop_constraint('uq_orders_idempotency_scope_key', 'orders', type_='unique')
    if _has_index(bind, 'orders', 'ix_orders_idempotency_key'):
        op.drop_index('ix_orders_idempotency_key', table_name='orders')
    if not _has_unique(bind, 'orders', 'uq_orders_idempotency_key'):
        op.create_unique_constraint('uq_orders_idempotency_key', 'orders', ['idempotency_key'])
    if _has_column(bind, 'orders', 'idempotency_scope'):
        op.drop_column('orders', 'idempotency_scope')
