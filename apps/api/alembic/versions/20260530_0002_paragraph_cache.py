"""paragraph_cache table

Revision ID: 20260530_0002
Revises: 20260530_0001
Create Date: 2026-05-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260530_0002"
down_revision: Union[str, None] = "20260530_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "paragraph_cache",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("paragraph", sa.Text(), nullable=False),
        sa.Column("hard_words", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("theme", sa.String(length=64), nullable=False),
        sa.Column("persona", sa.String(length=64), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_paragraph_cache_generated_at"), "paragraph_cache", ["generated_at"])
    op.create_index(op.f("ix_paragraph_cache_persona"), "paragraph_cache", ["persona"])
    op.create_index(op.f("ix_paragraph_cache_theme"), "paragraph_cache", ["theme"])
    op.create_index(op.f("ix_paragraph_cache_user_id"), "paragraph_cache", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_paragraph_cache_user_id"), table_name="paragraph_cache")
    op.drop_index(op.f("ix_paragraph_cache_theme"), table_name="paragraph_cache")
    op.drop_index(op.f("ix_paragraph_cache_persona"), table_name="paragraph_cache")
    op.drop_index(op.f("ix_paragraph_cache_generated_at"), table_name="paragraph_cache")
    op.drop_table("paragraph_cache")
