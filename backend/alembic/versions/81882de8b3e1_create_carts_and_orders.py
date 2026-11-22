"""create carts and orders

Revision ID: 81882de8b3e1
Revises: 665547278670
Create Date: 2026-11-21 23:35:39.210897

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '81882de8b3e1'
down_revision: Union[str, Sequence[str], None] = '665547278670'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('carts',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=True),
    sa.Column('guest_token_hash', sa.String(length=64), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint('(user_id IS NOT NULL) OR (guest_token_hash IS NOT NULL)', name='ck_carts_owner_present'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_carts_guest_token_hash'), 'carts', ['guest_token_hash'], unique=True)
    op.create_index(op.f('ix_carts_user_id'), 'carts', ['user_id'], unique=True)
    op.create_table('orders',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('order_number', sa.String(length=40), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=True),
    sa.Column('guest_email', sa.String(length=255), nullable=True),
    sa.Column('guest_full_name', sa.String(length=200), nullable=True),
    sa.Column('guest_phone', sa.String(length=30), nullable=True),
    sa.Column('guest_address', sa.Text(), nullable=True),
    sa.Column('guest_access_token_hash', sa.String(length=64), nullable=True),
    sa.Column('status', sa.String(length=30), nullable=False),
    sa.Column('currency', sa.String(length=3), nullable=False),
    sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('idempotency_key', sa.String(length=128), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint('subtotal >= 0', name='ck_orders_subtotal_non_negative'),
    sa.CheckConstraint('total >= 0', name='ck_orders_total_non_negative'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('idempotency_key', name='uq_orders_idempotency_key'),
    sa.UniqueConstraint('order_number', name='uq_orders_order_number')
    )
    op.create_index(op.f('ix_orders_guest_access_token_hash'), 'orders', ['guest_access_token_hash'], unique=False)
    op.create_index(op.f('ix_orders_order_number'), 'orders', ['order_number'], unique=False)
    op.create_index(op.f('ix_orders_status'), 'orders', ['status'], unique=False)
    op.create_index(op.f('ix_orders_user_id'), 'orders', ['user_id'], unique=False)
    op.create_table('cart_items',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('cart_id', sa.UUID(), nullable=False),
    sa.Column('product_id', sa.UUID(), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint('quantity > 0', name='ck_cart_items_quantity_positive'),
    sa.ForeignKeyConstraint(['cart_id'], ['carts.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('cart_id', 'product_id', name='uq_cart_items_cart_product')
    )
    op.create_index(op.f('ix_cart_items_cart_id'), 'cart_items', ['cart_id'], unique=False)
    op.create_index(op.f('ix_cart_items_product_id'), 'cart_items', ['product_id'], unique=False)
    op.create_table('order_items',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('order_id', sa.UUID(), nullable=False),
    sa.Column('product_id', sa.UUID(), nullable=True),
    sa.Column('product_name', sa.String(length=160), nullable=False),
    sa.Column('product_slug', sa.String(length=180), nullable=False),
    sa.Column('unit_price_cop', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('line_total_cop', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint('line_total_cop >= 0', name='ck_order_items_line_total_non_negative'),
    sa.CheckConstraint('quantity > 0', name='ck_order_items_quantity_positive'),
    sa.CheckConstraint('unit_price_cop >= 0', name='ck_order_items_unit_price_non_negative'),
    sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_order_items_order_id'), 'order_items', ['order_id'], unique=False)
    op.create_index(op.f('ix_order_items_product_id'), 'order_items', ['product_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_order_items_product_id'), table_name='order_items')
    op.drop_index(op.f('ix_order_items_order_id'), table_name='order_items')
    op.drop_table('order_items')
    op.drop_index(op.f('ix_cart_items_product_id'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_cart_id'), table_name='cart_items')
    op.drop_table('cart_items')
    op.drop_index(op.f('ix_orders_user_id'), table_name='orders')
    op.drop_index(op.f('ix_orders_status'), table_name='orders')
    op.drop_index(op.f('ix_orders_order_number'), table_name='orders')
    op.drop_index(op.f('ix_orders_guest_access_token_hash'), table_name='orders')
    op.drop_table('orders')
    op.drop_index(op.f('ix_carts_user_id'), table_name='carts')
    op.drop_index(op.f('ix_carts_guest_token_hash'), table_name='carts')
    op.drop_table('carts')
