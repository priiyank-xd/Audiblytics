"""days_of_use table

Revision ID: 20260601_0007
Revises: 20260531_0006
Create Date: 2026-06-01

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260601_0007"
down_revision: Union[str, None] = "20260531_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "days_of_use",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("utc_date", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "utc_date"),
    )


def downgrade() -> None:
    op.drop_table("days_of_use")
