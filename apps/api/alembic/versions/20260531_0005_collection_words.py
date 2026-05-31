"""collection_words table

Revision ID: 20260531_0005
Revises: 20260531_0004
Create Date: 2026-05-31

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260531_0005"
down_revision: Union[str, None] = "20260531_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "collection_words",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("word", sa.String(length=256), nullable=False),
        sa.Column("ipa", sa.String(length=256), nullable=False),
        sa.Column("pronunciation_guide", sa.String(length=512), nullable=False),
        sa.Column("meaning", sa.Text(), nullable=False),
        sa.Column("example_sentence", sa.Text(), nullable=False),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("source_paragraph_id", sa.Uuid(), nullable=True),
        sa.Column("review_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("difficulty_rating", sa.Integer(), nullable=False, server_default="1"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "word", name="uq_collection_words_user_word"),
    )
    op.create_index(op.f("ix_collection_words_last_reviewed_at"), "collection_words", ["last_reviewed_at"])
    op.create_index(op.f("ix_collection_words_saved_at"), "collection_words", ["saved_at"])
    op.create_index(op.f("ix_collection_words_user_id"), "collection_words", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_collection_words_user_id"), table_name="collection_words")
    op.drop_index(op.f("ix_collection_words_saved_at"), table_name="collection_words")
    op.drop_index(op.f("ix_collection_words_last_reviewed_at"), table_name="collection_words")
    op.drop_table("collection_words")
