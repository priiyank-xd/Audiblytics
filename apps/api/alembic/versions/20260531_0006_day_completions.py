"""day_completions table

Revision ID: 20260531_0006
Revises: 20260531_0005
Create Date: 2026-05-31

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260531_0006"
down_revision: Union[str, None] = "20260531_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "day_completions",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("utc_date", sa.Date(), nullable=False),
        sa.Column("has_read_it", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("has_recording", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("used_offline_pack", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "utc_date"),
    )


def downgrade() -> None:
    op.drop_table("day_completions")
