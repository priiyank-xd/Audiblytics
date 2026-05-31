"""recordings table

Revision ID: 20260531_0004
Revises: 20260530_0003
Create Date: 2026-05-31

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260531_0004"
down_revision: Union[str, None] = "20260530_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "recordings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("recording_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("paragraph_id", sa.String(length=128), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(length=128), nullable=False),
        sa.Column("storage_key", sa.String(length=512), nullable=True),
        sa.Column("day_of_use", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("storage_key"),
    )
    op.create_index(op.f("ix_recordings_recording_date"), "recordings", ["recording_date"])
    op.create_index(op.f("ix_recordings_user_id"), "recordings", ["user_id"])
    op.create_index(
        "ix_recordings_user_id_recording_date",
        "recordings",
        ["user_id", "recording_date"],
        postgresql_ops={"recording_date": "DESC"},
    )


def downgrade() -> None:
    op.drop_index("ix_recordings_user_id_recording_date", table_name="recordings")
    op.drop_index(op.f("ix_recordings_user_id"), table_name="recordings")
    op.drop_index(op.f("ix_recordings_recording_date"), table_name="recordings")
    op.drop_table("recordings")
