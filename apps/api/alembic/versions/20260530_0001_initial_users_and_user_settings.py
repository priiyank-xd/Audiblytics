"""initial users and user_settings

Revision ID: 20260530_0001
Revises:
Create Date: 2026-05-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260530_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "user_settings",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("theme", sa.String(length=64), nullable=False, server_default="adventure"),
        sa.Column("persona", sa.String(length=64), nullable=False, server_default="storyteller"),
        sa.Column("length", sa.Integer(), nullable=False, server_default="150"),
        sa.Column("retention", sa.String(length=32), nullable=False, server_default="90-day-rolling"),
        sa.Column("voice_uri", sa.String(length=512), nullable=True),
        sa.Column("active_provider", sa.String(length=32), nullable=False, server_default="gemini"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("user_settings")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
