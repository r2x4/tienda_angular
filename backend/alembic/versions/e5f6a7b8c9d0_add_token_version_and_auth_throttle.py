"""add token_version to users and auth throttle counters

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-11-21 23:59:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("token_version", sa.Integer(), nullable=False, server_default="1"))
    op.alter_column("users", "token_version", server_default=None)

    op.create_table(
        "auth_throttle_counters",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("key_hash", sa.String(length=64), nullable=False),
        sa.Column("scope", sa.String(length=30), nullable=False),
        sa.Column("window_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("blocked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key_hash", "scope", name="uq_auth_throttle_key_scope"),
    )
    op.create_index(op.f("ix_auth_throttle_counters_key_hash"), "auth_throttle_counters", ["key_hash"], unique=False)
    op.create_index(op.f("ix_auth_throttle_counters_scope"), "auth_throttle_counters", ["scope"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_auth_throttle_counters_scope"), table_name="auth_throttle_counters")
    op.drop_index(op.f("ix_auth_throttle_counters_key_hash"), table_name="auth_throttle_counters")
    op.drop_table("auth_throttle_counters")
    op.drop_column("users", "token_version")
